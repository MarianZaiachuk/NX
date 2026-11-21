from __future__ import annotations

import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TradeStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class Trade(Base):
    """AI trade lifecycle record.

    Workers select expired IN_PROGRESS rows with FOR UPDATE SKIP LOCKED. That
    makes horizontal worker scaling safe: competing workers skip rows already
    claimed by another worker instead of blocking or closing the same trade twice.
    """

    __tablename__ = "trades"
    __table_args__ = (
        CheckConstraint("stake_amount > 0", name="ck_trades_stake_positive"),
        CheckConstraint("payout_amount > 0", name="ck_trades_payout_positive"),
        Index("ix_trades_status_unlock_time", "status", "unlock_time"),
        Index("ix_trades_user_status", "user_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[TradeStatus] = mapped_column(
        Enum(TradeStatus, name="trade_status"),
        nullable=False,
        default=TradeStatus.IN_PROGRESS,
        server_default=text("'IN_PROGRESS'"),
    )
    stake_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    payout_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    profit_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    unlock_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    user = relationship("User", back_populates="trades")
