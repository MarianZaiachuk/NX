import httpx
import asyncio

async def test_flow():
    base_url = "http://localhost:8000/api"
    
    async with httpx.AsyncClient() as client:
        print("1. Registering user...")
        res = await client.post(f"{base_url}/auth/register", json={
            "display_name": "E2E Test User",
            "email": "e2e@example.com",
            "password": "password123",
            "fund_password": "password123",
            "code": "123456",
            "referral_code": ""
        })
        
        # If already exists, login instead
        if res.status_code == 400 and "already registered" in res.text:
            print("User already exists, logging in...")
            res = await client.post(f"{base_url}/auth/login", json={
                "email": "e2e@example.com",
                "password": "password123"
            })
            
        assert res.status_code == 200, f"Auth failed: {res.text}"
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("-> Auth successful, got token.")

        print("2. Fetching user state...")
        res = await client.get(f"{base_url}/users/me/state", headers=headers)
        assert res.status_code == 200, f"State failed: {res.text}"
        data = res.json()
        print(f"-> State fetched. Balance: {data['balance']}")
        
        print("3. Starting a delegated trade...")
        res = await client.post(f"{base_url}/trades/delegate", headers=headers)
        if res.status_code == 409 and "already an active trade" in res.text:
            print("-> Trade already active.")
            trade_id = data.get("active_trade", {}).get("trade_id")
        else:
            assert res.status_code == 200, f"Trade failed: {res.text}"
            trade_id = res.json()["trade"]["trade_id"]
            print(f"-> Trade started successfully. Trade ID: {trade_id}")
            
        print("4. Checking trade status...")
        res = await client.get(f"{base_url}/trades/status/{trade_id}", headers=headers)
        assert res.status_code == 200, f"Status failed: {res.text}"
        status_data = res.json()
        print(f"-> Trade Status: {status_data['trade']['status']}, Balance: {status_data['balance']}")

        print("All tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(test_flow())
