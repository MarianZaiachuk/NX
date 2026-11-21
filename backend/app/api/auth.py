from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal

from app.db.session import get_session
from app.models.user import User
from app.models.email_verification import EmailVerification
from app.schemas.auth import UserRegister, UserLogin, Token, SendCodeRequest
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user
from app.services.email import send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])

import secrets
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy import func, delete

@router.post("/send-code")
async def send_code(
    data: SendCodeRequest,
    session: AsyncSession = Depends(get_session)
):
    existing = await session.scalar(select(User).where(User.email == data.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    await session.execute(delete(EmailVerification).where(EmailVerification.email == data.email))
    
    code = f"{random.randint(0, 999999):06d}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    verification = EmailVerification(email=data.email, code=code, expires_at=expires_at)
    session.add(verification)
    await session.commit()
    
    await send_verification_email(data.email, code)
    
    return {"message": "Verification code sent"}

@router.post("/register", response_model=Token)
async def register(
    data: UserRegister,
    session: AsyncSession = Depends(get_session)
):
    existing = await session.scalar(select(User).where(User.email == data.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    if not data.fund_password.isdigit() or len(data.fund_password) < 6:
        raise HTTPException(status_code=400, detail="Fund password must be at least 6 digits")

    verification = await session.scalar(
        select(EmailVerification)
        .where(EmailVerification.email == data.email)
        .where(EmailVerification.code == data.code)
    )
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    if verification.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification code expired")
        
    initial_balance = Decimal("0.00")
    referrer_id = None
    
    if data.referral_code:
        referrer = await session.scalar(select(User).where(User.referral_code == data.referral_code).with_for_update())
        if referrer:
            referrer_id = referrer.id
            # Bonus will be awarded when the user makes a deposit


    while True:
        new_uid = random.randint(10000000, 99999999)
        existing_uid = await session.scalar(select(User).where(User.uid == new_uid))
        if not existing_uid:
            break

    code = str(new_uid)



    user = User(
        email=data.email,
        display_name=data.display_name,
        hashed_password=get_password_hash(data.password),
        fund_password_hashed=get_password_hash(data.fund_password),
        balance=initial_balance,
        referral_code=code,
        uid=new_uid,
        referred_by_id=referrer_id
    )
    session.add(user)
    await session.execute(delete(EmailVerification).where(EmailVerification.email == data.email))
    await session.commit()
    await session.refresh(user)
    
    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token, token_type="bearer")

@router.post("/login", response_model=Token)
async def login(
    data: UserLogin,
    session: AsyncSession = Depends(get_session)
):
    user = await session.scalar(select(User).where(User.email == data.email))
    if not user or not user.hashed_password:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token, token_type="bearer")
