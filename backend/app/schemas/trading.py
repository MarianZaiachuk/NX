from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.trade import TradeStatus


class MoneyModel(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: lambda value: str(value)})


class DelegateTradeRequest(BaseModel):
    user_id: UUID


class TradeView(MoneyModel):
    trade_id: UUID
    status: TradeStatus
    stake_amount: Decimal
    payout_amount: Decimal
    profit_amount: Decimal
    unlock_time: datetime
    created_at: datetime
    completed_at: datetime | None


class DelegateTradeResponse(MoneyModel):
    user_id: UUID
    balance: Decimal
    trade: TradeView
    server_time: datetime


class TradeStatusResponse(MoneyModel):
    user_id: UUID
    balance: Decimal
    trade: TradeView
    server_time: datetime


class UserStateResponse(MoneyModel):
    user_id: UUID
    uid: int | None = None
    email: str | None = None
    phone: str | None = None
    referral_code: str | None = None
    display_name: str
    status: str
    balance: Decimal
    spot_balance: Decimal = Decimal("0.00")
    total_deposit: Decimal = Decimal("0.00")
    today_profit: Decimal = Decimal("0.00")
    is_admin: bool = False
    has_signals_access: bool = False
    agent_level: int = 0
    active_trade: TradeView | None
    latest_trade: TradeView | None
    server_time: datetime

class TransferRequest(BaseModel):
    amount: Decimal
    from_wallet: str
    to_wallet: str

class GlobalSessionResponse(BaseModel):
    is_active: bool
    is_locked: bool = False
    session_start: datetime
    session_end: datetime
    server_time: datetime

class ReferredUser(MoneyModel):
    email_masked: str
    total_referrals: int
    total_deposit: Decimal

class ReferralStatsResponse(MoneyModel):
    referral_code: str | None
    agent_level: int = 0
    total_referrals: int
    total_deposit_sum: Decimal
    level_1: list[ReferredUser]
    level_2: list[ReferredUser]
    level_3: list[ReferredUser]

