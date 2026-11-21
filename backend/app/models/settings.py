from __future__ import annotations

import uuid
from decimal import Decimal
from sqlalchemy import Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class GlobalSettings(Base):
    __tablename__ = "global_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    referral_deposit_threshold: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("500.00"), server_default="500.00", nullable=False)
