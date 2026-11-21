import asyncio
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)

async def agent_payout_loop():
    """Background task that runs periodically to pay level 1 agents their weekly $115."""
    # Wait a few seconds for startup
    await asyncio.sleep(5)
    while True:
        try:
            await process_agent_payouts()
        except Exception as e:
            logger.error(f"Error in agent_payout_loop: {e}")
        # Run every hour
        await asyncio.sleep(3600)

async def process_agent_payouts():
    async with AsyncSessionLocal() as session:
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(days=7)
        
        result = await session.execute(
            select(User)
            .where(User.agent_level >= 1)
            .where(User.last_weekly_payout_at <= cutoff)
        )
        agents = result.scalars().all()
        
        if not agents:
            return
            
        for agent in agents:
            agent.balance += Decimal("115.00")
            
            # If it's very far behind, just set it to now, else exactly +7 days
            if agent.last_weekly_payout_at < now - timedelta(days=14):
                agent.last_weekly_payout_at = now
            else:
                agent.last_weekly_payout_at += timedelta(days=7)
                
            logger.info(f"Paid $115 to agent {agent.id}")
            
        await session.commit()
