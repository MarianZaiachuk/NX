from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.trading import (
    DelegateTradeResponse,
    TradeStatusResponse,
    UserStateResponse,
    GlobalSessionResponse,
    ReferralStatsResponse,
)
from app.services.trading import (
    InsufficientBalanceError,
    TradeNotFoundError,
    UserNotFoundError,
    SessionLockedError,
    TradingError,
    create_delegated_trade,
    get_trade_state,
    get_user_state,
    process_expired_trades,
    to_trade_view,
    utc_now,
    get_global_session,
)
from app.api.deps import get_current_user
from app.models.user import User
from sqlalchemy import func, select

router = APIRouter(tags=["trading"])


@router.post(
    "/trades/delegate",
    response_model=DelegateTradeResponse,
    status_code=status.HTTP_200_OK,
)
async def delegate_trade_to_ai(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DelegateTradeResponse:
    """Instantly starts an AI trade.

    This endpoint never waits for the 20-minute simulation window. It deducts
    the stake and creates the IN_PROGRESS trade in a short transaction, then
    returns immediately so the frontend can run its local timer.
    """

    try:
        user, trade = await create_delegated_trade(session, user_id=current_user.id)
    except TradingError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except SessionLockedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InsufficientBalanceError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    return DelegateTradeResponse(
        user_id=user.id,
        balance=user.balance,
        trade=to_trade_view(trade),
        server_time=utc_now(),
    )


@router.get(
    "/trades/status/{trade_id}",
    response_model=TradeStatusResponse,
)
async def read_trade_status(
    trade_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> TradeStatusResponse:
    """Fetch balance and a trade status after the local timer ends.

    The background worker is the normal completion path. This endpoint also
    tries to close the requested trade if it is already expired, which removes
    up-to-one-minute scheduler jitter without doing long polling or sleeping in
    the request.
    """

    try:
        await process_expired_trades(session, trade_id=trade_id, batch_size=1)
        user, trade = await get_trade_state(session, user_id=current_user.id, trade_id=trade_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except TradeNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return TradeStatusResponse(
        user_id=user.id,
        balance=user.balance,
        trade=to_trade_view(trade),
        server_time=utc_now(),
    )


@router.get("/users/me/state", response_model=UserStateResponse)
async def read_user_state(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> UserStateResponse:
    """Initial app bootstrap: current balance and known trade state."""

    try:
        user_state_response = await get_user_state(session, user_id=current_user.id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return user_state_response

from app.schemas.auth import ChangePhoneRequest, ChangePasswordRequest, ChangeFundPasswordRequest
from app.core.security import verify_password, get_password_hash

@router.post("/users/me/phone")
async def bind_phone(
    req: ChangePhoneRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if current_user.phone:
        raise HTTPException(status_code=400, detail="Phone already bound")
    
    # Check if phone already used by someone else
    existing = await session.scalar(select(User).where(User.phone == req.phone))
    if existing:
        raise HTTPException(status_code=400, detail="Phone already registered")
        
    current_user.phone = req.phone
    session.add(current_user)
    await session.commit()
    return {"status": "ok"}

@router.post("/users/me/password")
async def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not current_user.hashed_password:
        raise HTTPException(status_code=400, detail="User has no password set")
    
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    import re
    if not re.match(r"^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&_]{8,}$", req.new_password):
        raise HTTPException(status_code=400, detail="Password does not meet requirements")
        
    current_user.hashed_password = get_password_hash(req.new_password)
    session.add(current_user)
    await session.commit()
    return {"status": "ok"}

@router.post("/users/me/fund-password")
async def change_fund_password(
    req: ChangeFundPasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not current_user.fund_password_hashed:
        raise HTTPException(status_code=400, detail="User has no fund password set")
        
    if not verify_password(req.old_fund_password, current_user.fund_password_hashed):
        raise HTTPException(status_code=400, detail="Incorrect old fund password")
        
    if len(req.new_fund_password) < 6 or not req.new_fund_password.isdigit():
        raise HTTPException(status_code=400, detail="Fund password must be at least 6 digits")
        
    current_user.fund_password_hashed = get_password_hash(req.new_fund_password)
    session.add(current_user)
    await session.commit()
    return {"status": "ok"}


from app.models.settings import GlobalSettings
from app.models.transaction import Deposit
from decimal import Decimal

from pydantic import BaseModel
from app.models.kyc import KycRecord

class KycSubmitRequest(BaseModel):
    citizenship: str
    full_name: str
    document_number: str
    front_image: str
    back_image: str
    selfie_image: str

@router.post("/session/kyc")
async def submit_kyc(
    req: KycSubmitRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Check if existing KYC record
    existing = await session.scalar(select(KycRecord).where(KycRecord.user_id == current_user.id))
    if existing:
        raise HTTPException(status_code=400, detail="KYC request already submitted")

    record = KycRecord(
        user_id=current_user.id,
        citizenship=req.citizenship,
        full_name=req.full_name,
        document_number=req.document_number,
        front_image_base64=req.front_image,
        back_image_base64=req.back_image,
        selfie_image_base64=req.selfie_image
    )
    session.add(record)
    
    current_user.status = "Pending"
    
    await session.commit()

    return {"status": "ok"}

@router.get("/session/current", response_model=GlobalSessionResponse)
async def read_current_session(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> GlobalSessionResponse:
    settings = await session.scalar(select(GlobalSettings))
    threshold = settings.referral_deposit_threshold if settings else Decimal("500.00")
    
    has_valid_referral = False
    
    referrals = await session.execute(select(User).where(User.referred_by_id == current_user.id))
    referrals = referrals.scalars().all()
    
    for ref in referrals:
        total_deposit = await session.scalar(
            select(func.sum(Deposit.amount))
            .where(Deposit.user_id == ref.id)
            .where(Deposit.status == "Completed")
        ) or Decimal("0.00")
        if total_deposit >= threshold:
            has_valid_referral = True
            break

    is_active, start, end, is_locked = get_global_session(has_valid_referral, current_user.has_signals_access)
    return GlobalSessionResponse(
        is_active=is_active,
        is_locked=is_locked,
        session_start=start,
        session_end=end,
        server_time=utc_now(),
    )


from decimal import Decimal

@router.get("/users/me/referrals", response_model=ReferralStatsResponse)
async def read_referral_stats(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ReferralStatsResponse:
    def mask_email(email: str | None) -> str:
        if not email or "@" not in email:
            return "usr***com"
        name, domain = email.split("@", 1)
        domain_suffix = domain[-3:] if len(domain) >= 3 else "com"
        if len(name) > 3:
            return f"{name[:3]}***{domain_suffix}"
        return f"{name}***{domain_suffix}"

    lvl_1_query = await session.scalars(select(User).where(User.referred_by_id == current_user.id))
    level_1_users = list(lvl_1_query)
    level_1_ids = [u.id for u in level_1_users]

    level_2_users = []
    level_2_ids = []
    if level_1_ids:
        lvl_2_query = await session.scalars(select(User).where(User.referred_by_id.in_(level_1_ids)))
        level_2_users = list(lvl_2_query)
        level_2_ids = [u.id for u in level_2_users]

    level_3_users = []
    if level_2_ids:
        lvl_3_query = await session.scalars(select(User).where(User.referred_by_id.in_(level_2_ids)))
        level_3_users = list(lvl_3_query)

    all_fetched_ids = level_1_ids + level_2_ids + [u.id for u in level_3_users]
    referrals_counts = {uid: 0 for uid in all_fetched_ids}
    if all_fetched_ids:
        counts = await session.execute(
            select(User.referred_by_id, func.count(User.id))
            .where(User.referred_by_id.in_(all_fetched_ids))
            .group_by(User.referred_by_id)
        )
        for ref_id, cnt in counts:
            referrals_counts[ref_id] = cnt

    def map_user(u: User) -> dict:
        return {
            "email_masked": mask_email(u.email),
            "total_referrals": referrals_counts.get(u.id, 0),
            "total_deposit": getattr(u, "total_deposit", Decimal("0.00"))
        }

    lvl_1_data = [map_user(u) for u in level_1_users]
    lvl_2_data = [map_user(u) for u in level_2_users]
    lvl_3_data = [map_user(u) for u in level_3_users]

    total_deposit_sum = sum([Decimal(str(getattr(u, "total_deposit", "0.00"))) for u in level_1_users + level_2_users + level_3_users])
    total_referrals = len(level_1_users) + len(level_2_users) + len(level_3_users)

    return ReferralStatsResponse(
        referral_code=current_user.referral_code,
        agent_level=getattr(current_user, "agent_level", 0),
        total_referrals=total_referrals,
        total_deposit_sum=total_deposit_sum,
        level_1=lvl_1_data,
        level_2=lvl_2_data,
        level_3=lvl_3_data
    )


from app.schemas.trading import TransferRequest

@router.post("/wallet/transfer")
async def transfer_wallet(
    req: TransferRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    # lock user
    user = await session.scalar(select(User).where(User.id == current_user.id).with_for_update())
    
    if req.from_wallet == "Funds" and req.to_wallet == "Spot":
        if user.balance < req.amount:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        user.balance -= req.amount
        user.spot_balance += req.amount
    elif req.from_wallet == "Spot" and req.to_wallet == "Funds":
        if user.spot_balance < req.amount:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        user.spot_balance -= req.amount
        user.balance += req.amount
    else:
        raise HTTPException(status_code=400, detail="Invalid wallets")
        
    await session.commit()
    
    return {"status": "ok", "balance": str(user.balance), "spot_balance": str(user.spot_balance)}

