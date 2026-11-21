from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
import hmac
import hashlib
import json

from app.db.session import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.transaction import Deposit, Withdrawal
from app.services.nowpayments import NowPaymentsService
from app.core.config import settings
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/wallet", tags=["wallet"])

class DepositRequest(BaseModel):
    amount: Decimal

@router.get("/deposit-info")
async def get_deposit_info(
    current_user: User = Depends(get_current_user),
):
    if settings.static_deposit_address:
        return {
            "type": "static",
            "address": settings.static_deposit_address,
            "currency": "USDT",
            "network": "TRC20"
        }
    return {"type": "dynamic"}

@router.post("/deposit")
async def create_deposit(
    req: DepositRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if req.amount < 10:
        raise HTTPException(status_code=400, detail="Minimum deposit is 10 USDT")

    # Create pending deposit
    deposit = Deposit(
        user_id=current_user.id,
        amount=req.amount,
        status="Pending"
    )
    session.add(deposit)
    await session.commit()
    await session.refresh(deposit)

    # Call NowPayments (or use static address)
    try:
        if settings.static_deposit_address:
            # We don't save a payment_id for static deposits
            return {
                "deposit_id": str(deposit.id),
                "pay_address": settings.static_deposit_address,
                "pay_amount": req.amount,
                "pay_currency": "usdttrc20"
            }
            
        payment = await NowPaymentsService.create_payment(
            amount=req.amount,
            order_id=str(deposit.id)
        )
        deposit.payment_id = payment.get("payment_id")
        await session.commit()
        return {
            "deposit_id": str(deposit.id),
            "pay_address": payment.get("pay_address"),
            "pay_amount": payment.get("pay_amount"),
            "pay_currency": payment.get("pay_currency")
        }
    except Exception as e:
        deposit.status = "Failed"
        await session.commit()
        raise HTTPException(status_code=400, detail="Failed to generate payment address")

@router.post("/webhook")
async def nowpayments_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    body = await request.body()
    signature = request.headers.get("x-nowpayments-sig")
    
    if not signature:
        raise HTTPException(status_code=400, detail="No signature")
        
    expected_sig = hmac.new(
        settings.nowpayments_ipn_secret.encode(),
        body,
        hashlib.sha512
    ).hexdigest()
    
    if signature != expected_sig:
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    data = await request.json()
    order_id = data.get("order_id")
    payment_status = data.get("payment_status")
    
    if not order_id:
        return {"status": "ignored"}
        
    deposit = await session.scalar(
        select(Deposit).where(Deposit.id == uuid.UUID(order_id)).with_for_update()
    )
    
    if not deposit or deposit.status == "Completed":
        return {"status": "ok"}
        
    if payment_status == "finished":
        deposit.status = "Completed"
        
        user = await session.scalar(
            select(User).where(User.id == deposit.user_id).with_for_update()
        )
        if user:
            user.spot_balance += deposit.amount
            user.total_deposit += deposit.amount
            
            from app.services.bonus import check_and_award_referral_bonus
            await check_and_award_referral_bonus(user, session)
            
        await session.commit()
        
    return {"status": "ok"}

class WithdrawRequest(BaseModel):
    amount: Decimal
    wallet_address: str
    fund_password: str

from app.core.security import verify_password

from app.models.trade import Trade
from sqlalchemy import func

@router.post("/withdraw")
async def create_withdrawal(
    req: WithdrawRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Lock user
    user = await session.scalar(select(User).where(User.id == current_user.id).with_for_update())
    
    if req.amount < 10:
        raise HTTPException(status_code=400, detail="Minimum withdrawal is 10 USDT")
        
    if user.status != "Verified":
        raise HTTPException(status_code=400, detail="KYC verification is required before withdrawing funds")
        
    if not verify_password(req.fund_password, user.fund_password_hashed):
        raise HTTPException(status_code=400, detail="Invalid fund password")
        
    if user.spot_balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient spot balance")
        
    # Check if this wallet address was used by another user
    existing_address = await session.scalar(
        select(Withdrawal).where(
            Withdrawal.wallet_address == req.wallet_address,
            Withdrawal.user_id != user.id
        ).limit(1)
    )
    if existing_address:
        raise HTTPException(status_code=400, detail="Ця адреса вже використовується іншим акаунтом (This address is already used by another account)")

    # Calculate fee based on turnover
    total_profit = await session.scalar(
        select(func.sum(Trade.profit_amount))
        .where(
            Trade.user_id == user.id, 
            Trade.status == "COMPLETED"
        )
    ) or Decimal("0.00")

    if user.total_deposit > 0 and total_profit < user.total_deposit:
        fee_percentage = Decimal("0.20")
    else:
        fee_percentage = Decimal("0.05")

    fee_amount = req.amount * fee_percentage

    user.spot_balance -= req.amount
    
    withdrawal = Withdrawal(
        user_id=user.id,
        amount=req.amount,
        fee=fee_amount,
        wallet_address=req.wallet_address,
        status="Pending"
    )
    session.add(withdrawal)
    await session.commit()
    
    return {"status": "ok", "message": "Withdrawal requested successfully", "withdrawal_id": str(withdrawal.id)}

class TransactionHistoryItem(BaseModel):
    id: str
    type: str
    amount: str
    status: str
    created_at: str

@router.get("/history", response_model=list[TransactionHistoryItem])
async def get_transaction_history(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    deposits = (await session.scalars(
        select(Deposit).where(Deposit.user_id == current_user.id).order_by(Deposit.created_at.desc())
    )).all()
    
    withdrawals = (await session.scalars(
        select(Withdrawal).where(Withdrawal.user_id == current_user.id).order_by(Withdrawal.created_at.desc())
    )).all()
    
    history = []
    for d in deposits:
        history.append({
            "id": str(d.id),
            "type": "deposit",
            "amount": str(d.amount),
            "status": d.status,
            "created_at": d.created_at.isoformat()
        })
        
    for w in withdrawals:
        history.append({
            "id": str(w.id),
            "type": "withdrawal",
            "amount": str(w.amount),
            "status": w.status,
            "created_at": w.created_at.isoformat()
        })
        
    history.sort(key=lambda x: x["created_at"], reverse=True)
    return history
