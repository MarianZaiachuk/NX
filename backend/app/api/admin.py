from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from pydantic import BaseModel
from typing import List
from app.db.session import get_session
from app.api.deps import get_current_admin
from app.models.user import User

router = APIRouter(tags=["admin"])

from decimal import Decimal
from datetime import datetime
import uuid
from app.core.security import create_access_token
from app.models.transaction import Deposit, Withdrawal

class UserUpdate(BaseModel):
    status: str | None = None
    balance: Decimal | None = None
    has_signals_access: bool | None = None

class UserResponse(BaseModel):
    id: str
    email: str | None
    display_name: str
    status: str
    is_admin: bool
    balance: Decimal
    has_signals_access: bool
    created_at: datetime
    referral_code: str | None
    referred_by_code: str | None

    class Config:
        from_attributes = True

class PaginatedUsersResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    total_pages: int

@router.get("/admin/users", response_model=PaginatedUsersResponse)
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    admin: User = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    from sqlalchemy.orm import aliased
    ReferredBy = aliased(User)
    
    query = select(User, ReferredBy.referral_code.label('referred_by_code')).outerjoin(
        ReferredBy, User.referred_by_id == ReferredBy.id
    )
    
    if search:
        query = query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.display_name.ilike(f"%{search}%")
            )
        )
    
    if status_filter and status_filter.lower() != "all":
        query = query.where(User.status == status_filter)
        
    # Count total for pagination
    count_query = select(func.count()).select_from(query.subquery())
    total = await session.scalar(count_query)
    
    # Get paginated data
    query = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await session.execute(query)
    rows = result.all()
    
    total_pages = (total + limit - 1) // limit if total else 1
    
    return PaginatedUsersResponse(
        users=[
            UserResponse(
                id=str(u.id),
                email=u.email,
                display_name=u.display_name,
                status=u.status,
                is_admin=u.is_admin,
                balance=u.balance,
                has_signals_access=u.has_signals_access,
                created_at=u.created_at,
                referral_code=u.referral_code,
                referred_by_code=referred_by_code
            ) for u, referred_by_code in rows
        ],
        total=total or 0,
        page=page,
        total_pages=total_pages
    )

@router.patch("/admin/users/{user_id}")
async def update_user(
    user_id: str,
    update_data: UserUpdate,
    admin: User = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    from uuid import UUID
    
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    user = await session.scalar(select(User).where(User.id == user_uuid).with_for_update())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if update_data.status is not None:
        valid_statuses = ["Pending", "Verified", "Rejected"]
        if update_data.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        user.status = update_data.status
        
    if update_data.balance is not None:
        if update_data.balance < 0:
            raise HTTPException(status_code=400, detail="Balance cannot be negative")
            
        if update_data.balance > user.balance:
            diff = update_data.balance - user.balance
            deposit = Deposit(
                user_id=user.id,
                amount=diff,
                status="Completed",
                payment_id=f"admin_{uuid.uuid4()}"
            )
            session.add(deposit)
            
            # Update total deposit and check referral bonus
            user.total_deposit += diff
            from app.services.bonus import check_and_award_referral_bonus
            await check_and_award_referral_bonus(user, session)
        elif update_data.balance < user.balance:
            diff = user.balance - update_data.balance
            withdrawal = Withdrawal(
                user_id=user.id,
                amount=diff,
                wallet_address="Admin adjustment",
                status="Completed",
                admin_note="Admin deduction"
            )
            session.add(withdrawal)
            
        user.balance = update_data.balance
        
    if update_data.has_signals_access is not None:
        user.has_signals_access = update_data.has_signals_access
        
    await session.commit()
    
    return {"message": "User updated successfully"}

@router.post("/admin/users/{user_id}/impersonate")
async def impersonate_user(
    user_id: str,
    admin: User = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    from uuid import UUID
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    user = await session.scalar(select(User).where(User.id == user_uuid))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}

from app.models.transaction import Withdrawal

class WithdrawalResponse(BaseModel):
    id: str
    user_id: str
    user_email: str | None
    user_uid: str | None
    amount: Decimal
    fee: Decimal
    wallet_address: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/admin/withdrawals", response_model=List[WithdrawalResponse])
async def get_withdrawals(
    status_filter: str | None = Query(None, alias="status"),
    admin: User = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    query = select(Withdrawal, User).join(User, Withdrawal.user_id == User.id)
    
    if status_filter and status_filter.lower() != "all":
        query = query.where(Withdrawal.status == status_filter)
        
    query = query.order_by(Withdrawal.created_at.desc())
    
    result = await session.execute(query)
    rows = result.all()
    
    return [
        WithdrawalResponse(
            id=str(w.id),
            user_id=str(u.id),
            user_email=u.email,
            user_uid=u.uid,
            amount=w.amount,
            fee=w.fee,
            wallet_address=w.wallet_address,
            status=w.status,
            created_at=w.created_at
        ) for w, u in rows
    ]

@router.post("/admin/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(
    withdrawal_id: str,
    admin: User = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    from uuid import UUID
    try:
        w_id = UUID(withdrawal_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid withdrawal ID")

    withdrawal = await session.scalar(select(Withdrawal).where(Withdrawal.id == w_id).with_for_update())
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
        
    if withdrawal.status != "Pending":
        raise HTTPException(status_code=400, detail="Only pending withdrawals can be approved")
        
    withdrawal.status = "Completed"
    await session.commit()
    
    return {"message": "Withdrawal approved"}

@router.post("/admin/withdrawals/{withdrawal_id}/reject")
async def reject_withdrawal(
    withdrawal_id: str,
    admin: User = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    from uuid import UUID
    try:
        w_id = UUID(withdrawal_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid withdrawal ID")

    withdrawal = await session.scalar(select(Withdrawal).where(Withdrawal.id == w_id).with_for_update())
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
        
    if withdrawal.status != "Pending":
        raise HTTPException(status_code=400, detail="Only pending withdrawals can be rejected")
        
    withdrawal.status = "Rejected"
    
    # Refund user balance
    user = await session.scalar(select(User).where(User.id == withdrawal.user_id).with_for_update())
    if user:
        user.spot_balance += withdrawal.amount
        
    await session.commit()
    
    return {"message": "Withdrawal rejected and funds returned to user"}

from app.models.settings import GlobalSettings

class SettingsUpdate(BaseModel):
    referral_deposit_threshold: Decimal | None = None

class SettingsResponse(BaseModel):
    referral_deposit_threshold: Decimal

    class Config:
        from_attributes = True

@router.get("/admin/settings", response_model=SettingsResponse)
async def get_settings(
    admin: User = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    settings = await session.scalar(select(GlobalSettings))
    if not settings:
        settings = GlobalSettings()
        session.add(settings)
        await session.commit()
        await session.refresh(settings)
    return settings

from app.models.kyc import KycRecord

@router.get("/admin/users/{user_id}/kyc")
async def get_user_kyc(
    user_id: uuid.UUID,
    current_admin: User = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    kyc = await session.scalar(select(KycRecord).where(KycRecord.user_id == user_id))
    if not kyc:
        return None
        
    return {
        "citizenship": kyc.citizenship,
        "full_name": kyc.full_name,
        "document_number": kyc.document_number,
        "front_image": kyc.front_image_base64,
        "back_image": kyc.back_image_base64,
        "selfie_image": kyc.selfie_image_base64,
        "created_at": kyc.created_at
    }

@router.patch("/admin/settings", response_model=SettingsResponse)
async def update_settings(
    update_data: SettingsUpdate,
    admin: User = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    settings = await session.scalar(select(GlobalSettings).with_for_update())
    if not settings:
        settings = GlobalSettings()
        session.add(settings)
    
    if update_data.referral_deposit_threshold is not None:
        if update_data.referral_deposit_threshold < 0:
            raise HTTPException(status_code=400, detail="Threshold cannot be negative")
        settings.referral_deposit_threshold = update_data.referral_deposit_threshold
        
    await session.commit()
    await session.refresh(settings)
    return settings
