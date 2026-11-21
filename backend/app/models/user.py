from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, Numeric, String, Boolean, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    """Simulator user with a locked, transactional cash balance.

    Balance changes are made only inside service-layer transactions that lock
    this row with SELECT ... FOR UPDATE. That prevents double-spend races when a
    user quickly starts multiple AI trades from different browser tabs.
    """

    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("balance >= 0", name="ck_users_balance_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    uid: Mapped[int] = mapped_column(
        Numeric(10, 0),
        unique=True,
        index=True,
        nullable=True,
    )
    email: Mapped[str | None] = mapped_column(String(320), unique=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fund_password_hashed: Mapped[str | None] = mapped_column(String(255), nullable=True)
    balance: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default="0",
    )
    spot_balance: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default="0",
    )
    total_deposit: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default="0",
    )
    referral_code: Mapped[str | None] = mapped_column(String(8), unique=True, index=True, nullable=True)
    referred_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Pending", server_default="Pending", nullable=False)
    has_signals_access: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    has_received_first_deposit_bonus: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    referral_bonus_paid: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    agent_level: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    last_weekly_payout_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    trades = relationship("Trade", back_populates="user", cascade="all, delete-orphan")
    kyc_record = relationship("KycRecord", back_populates="user", uselist=False, cascade="all, delete-orphan")
