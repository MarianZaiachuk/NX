from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from decimal import Decimal
from datetime import datetime, timezone

from app.models.user import User
from app.models.settings import GlobalSettings

async def check_and_award_referral_bonus(user: User, session: AsyncSession) -> None:
    """
    Check if the user has reached the deposit threshold and award referral bonuses
    to both the referrer and the referred user if not already paid.
    """
    if user.referral_bonus_paid:
        return
        
    if not user.referred_by_id:
        return

    settings = await session.scalar(select(GlobalSettings))
    if not settings:
        return

    # Check if total deposit reaches the threshold
    if user.total_deposit >= settings.referral_deposit_threshold:
        # Get referrer
        referrer = await session.scalar(select(User).where(User.id == user.referred_by_id).with_for_update())
        if not referrer:
            return
            
        # Check how many users the referrer has successfully referred
        ref_count = await session.scalar(select(func.count(User.id)).where(User.referred_by_id == referrer.id, User.referral_bonus_paid == True))
        
        # Award bonus
        # If it's the referrer's first successful referral, they get 25, otherwise 30
        if ref_count == 0:
            referrer.balance += Decimal("25.00")
        else:
            referrer.balance += Decimal("30.00")
            
        # Agent promotion logic
        if ref_count + 1 >= 5 and referrer.agent_level < 1:
            referrer.agent_level = 1
            referrer.last_weekly_payout_at = datetime.now(timezone.utc)
            
        # The referred user gets 25
        user.balance += Decimal("25.00")
        
        # Mark as paid
        user.referral_bonus_paid = True
        
        # No need to commit here, we assume the caller commits the session
