from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import Trade, TradeStatus, User
from app.schemas.trading import TradeView, UserStateResponse


class TradingError(Exception):
    pass


class UserNotFoundError(TradingError):
    pass


class TradeNotFoundError(TradingError):
    pass


class InsufficientBalanceError(TradingError):
    pass


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_trade_view(trade: Trade) -> TradeView:
    return TradeView(
        trade_id=trade.id,
        status=trade.status,
        stake_amount=trade.stake_amount,
        payout_amount=trade.payout_amount,
        profit_amount=trade.profit_amount,
        unlock_time=trade.unlock_time,
        created_at=trade.created_at,
        completed_at=trade.completed_at,
    )


class SessionLockedError(TradingError):
    pass

def get_global_session(has_referral_deposit_met: bool = False, has_signals_access: bool = False) -> tuple[bool, datetime, datetime, bool]:
    """Returns (is_active, session_start, session_end, is_locked).
    
    Strict schedule: 12:00, 16:00, 20:00 (each 25 mins).
    20:00 session requires has_referral_deposit_met=True or has_signals_access=True.
    """
    now = utc_now()
    hour = now.hour
    minute = now.minute
    base_time = now.replace(second=0, microsecond=0)
    
    # Define session windows (9, 13, 17 in UTC corresponds to 12, 16, 20 in UTC+3 Kyiv time)
    session_hours = [9, 13, 17]
    
    current_session_hour = None
    next_session_hour = None
    
    # Find current or next session
    for s_hour in session_hours:
        if hour == s_hour and 0 <= minute < 25:
            current_session_hour = s_hour
            break
        elif hour < s_hour or (hour == s_hour and minute < 0):
            next_session_hour = s_hour
            break
            
    if current_session_hour is None and next_session_hour is None:
        # It's past 17:25, next session is 09:00 tomorrow
        is_active = False
        start = base_time.replace(hour=9, minute=0) + timedelta(days=1)
        end = base_time.replace(hour=9, minute=25) + timedelta(days=1)
        target_hour = 9
    elif current_session_hour is not None:
        is_active = True
        start = base_time.replace(hour=current_session_hour, minute=0)
        end = base_time.replace(hour=current_session_hour, minute=25)
        target_hour = current_session_hour
    else:
        is_active = False
        start = base_time.replace(hour=next_session_hour, minute=0)
        end = base_time.replace(hour=next_session_hour, minute=25)
        target_hour = next_session_hour
        
    # Lock logic for VIP 20:00 (17:00 UTC) session
    is_locked = False
    if target_hour == 17 and not has_referral_deposit_met and not has_signals_access:
        is_locked = True
        is_active = False
        
    return is_active, start, end, is_locked

from sqlalchemy import func

async def create_delegated_trade(
    session: AsyncSession,
    *,
    user_id: UUID,
) -> tuple[User, Trade]:
    user_result = await session.execute(
        select(User)
        .where(User.id == user_id)
        .with_for_update()
    )
    user = user_result.scalar_one_or_none()
    if user is None:
        raise UserNotFoundError(f"User {user_id} was not found")

    user_referrals = await session.scalar(select(func.count(User.id)).where(User.referred_by_id == user_id)) or 0
    is_active, session_start, _, is_locked = get_global_session(user_referrals, user.has_signals_access)
    unlock_time = utc_now() + timedelta(minutes=1)
    
    if is_locked:
        raise SessionLockedError("The 20:00 VIP session is locked. Invite 1 friend to unlock.")
    if not is_active:
        raise TradingError("Trading is currently disabled until the next session starts.")

    # Check active trades
    active_trade = await session.scalar(
        select(Trade).where(Trade.user_id == user_id, Trade.status == TradeStatus.IN_PROGRESS).limit(1)
    )
    if active_trade:
        raise TradingError("У вас вже є активна угода. Зачекайте її завершення.")

    # Check if user already took a trade in this specific session
    trade_in_session = await session.scalar(
        select(Trade).where(Trade.user_id == user_id, Trade.created_at >= session_start).limit(1)
    )
    if trade_in_session:
        raise TradingError("Ви вже використали сигнал цієї сесії. Дочекайтеся наступного!")

    # Check daily limit (4 trades max)
    today_start = datetime.combine(utc_now().date(), datetime.min.time(), tzinfo=timezone.utc)
    trades_today = await session.scalar(
        select(func.count(Trade.id))
        .where(Trade.user_id == user_id, Trade.created_at >= today_start)
    ) or 0
    if trades_today >= 4:
        raise TradingError("Денний ліміт угод (4/4) вичерпано. Приходьте завтра!")

    stake = (user.balance * Decimal("0.02")).quantize(Decimal("0.01"))
    profit = (user.balance * Decimal("0.01")).quantize(Decimal("0.01"))
    payout = stake + profit

    if user.balance < stake or stake <= 0:
        raise InsufficientBalanceError("Not enough balance to delegate this trade")

    user.balance -= stake
    trade = Trade(
        user_id=user.id,
        status=TradeStatus.IN_PROGRESS,
        stake_amount=stake,
        payout_amount=payout,
        profit_amount=profit,
        unlock_time=unlock_time,
    )
    session.add(trade)
    await session.commit()

    return user, trade


async def get_user_state(session: AsyncSession, *, user_id: UUID) -> UserStateResponse:
    user = await session.get(User, user_id)
    if user is None:
        raise UserNotFoundError(f"User {user_id} was not found")

    active_trade = (
        await session.execute(
            select(Trade)
            .where(Trade.user_id == user_id, Trade.status == TradeStatus.IN_PROGRESS)
            .order_by(Trade.unlock_time.asc())
            .limit(1)
        )
    ).scalar_one_or_none()

    latest_trade = (
        await session.execute(
            select(Trade)
            .where(Trade.user_id == user_id)
            .order_by(Trade.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    
    today_profit = await session.scalar(
        select(func.sum(Trade.profit_amount))
        .where(
            Trade.user_id == user_id, 
            Trade.status == TradeStatus.COMPLETED,
        )
    ) or Decimal("0.00")

    return UserStateResponse(
        user_id=user.id,
        uid=user.uid,
        email=user.email,
        phone=user.phone,
        referral_code=user.referral_code,
        display_name=user.display_name,
        status=user.status,
        balance=user.balance,
        spot_balance=user.spot_balance,
        total_deposit=user.total_deposit,
        today_profit=today_profit,
        is_admin=user.is_admin,
        has_signals_access=user.has_signals_access,
        agent_level=getattr(user, "agent_level", 0),
        active_trade=to_trade_view(active_trade) if active_trade else None,
        latest_trade=to_trade_view(latest_trade) if latest_trade else None,
        server_time=utc_now()
    )


async def get_trade_state(session: AsyncSession, *, user_id: UUID, trade_id: UUID) -> tuple[User, Trade]:
    user = await session.get(User, user_id)
    if user is None:
        raise UserNotFoundError(f"User {user_id} was not found")

    trade = (
        await session.execute(
            select(Trade).where(Trade.id == trade_id, Trade.user_id == user_id)
        )
    ).scalar_one_or_none()
    if trade is None:
        raise TradeNotFoundError(f"Trade {trade_id} was not found")

    return user, trade


def _expired_trade_stmt(*, trade_id: UUID | None, batch_size: int) -> Select[tuple[Trade]]:
    stmt = (
        select(Trade)
        .where(
            Trade.status == TradeStatus.IN_PROGRESS,
            Trade.unlock_time <= utc_now(),
        )
        .order_by(Trade.unlock_time.asc(), Trade.id.asc())
        .limit(batch_size)
        .with_for_update(skip_locked=True)
    )
    if trade_id is not None:
        stmt = stmt.where(Trade.id == trade_id)
    return stmt


async def process_expired_trades(
    session: AsyncSession,
    *,
    trade_id: UUID | None = None,
    batch_size: int | None = None,
) -> int:
    """Close expired trades and credit payouts with row-level locks.

    Deadlock prevention strategy:
    - Workers claim trade rows with FOR UPDATE SKIP LOCKED, so duplicate workers
      do not contend over the same trade.
    - Affected users are locked in deterministic UUID order before balances are
      updated. Deterministic lock ordering avoids cycles when batches overlap.
    - The transaction stays short: no network calls, sleeps, or CPU-heavy work
      while database locks are held.
    """

    limit = batch_size or settings.trade_batch_size
    now = utc_now()

    trades = (
        await session.execute(_expired_trade_stmt(trade_id=trade_id, batch_size=limit))
    ).scalars().all()
    if not trades:
        return 0

    payouts_by_user: dict[UUID, Decimal] = defaultdict(lambda: Decimal("0.00"))
    for trade in trades:
        payouts_by_user[trade.user_id] += trade.payout_amount

    user_ids = sorted(payouts_by_user)
    users = (
        await session.execute(
            select(User)
            .where(User.id.in_(user_ids))
            .order_by(User.id.asc())
            .with_for_update()
        )
    ).scalars().all()
    users_by_id = {user.id: user for user in users}

    for trade in trades:
        user = users_by_id.get(trade.user_id)
        if user is None:
            continue
        user.balance += trade.payout_amount
        trade.status = TradeStatus.COMPLETED
        trade.completed_at = now

    await session.commit()

    return len(trades)

