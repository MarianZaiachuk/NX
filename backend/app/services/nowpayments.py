import httpx
from decimal import Decimal
from app.core.config import settings

NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1"

class NowPaymentsService:
    @staticmethod
    async def create_payment(amount: Decimal, order_id: str, order_description: str = "Deposit") -> dict:
        """Create a payment in NowPayments and return the deposit address."""
        headers = {
            "x-api-key": settings.nowpayments_api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "price_amount": float(amount),
            "price_currency": "usd",
            "pay_currency": "usdttrc20",
            "order_id": order_id,
            "order_description": order_description,
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{NOWPAYMENTS_API_URL}/payment", json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
