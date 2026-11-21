import resend
from app.core.config import settings

async def send_verification_email(to_email: str, code: str):
    if not settings.resend_api_key:
        print(f"\n[EMAIL SIMULATION] Verification code for {to_email} is: {code}\n")
        return
        
    resend.api_key = settings.resend_api_key
    
    body = f"""
    Hello,
    
    Your verification code is: {code}
    
    This code is valid for 5 minutes.
    
    If you did not request this code, please ignore this email.
    
    Best regards,
    NX Team
    """

    try:
        resend.Emails.send({
            "from": settings.smtp_from_email or "onboarding@resend.dev",
            "to": to_email,
            "subject": "Your Verification Code - NX Trading",
            "text": body,
        })
        print(f"Sent verification email to {to_email} via Resend")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
