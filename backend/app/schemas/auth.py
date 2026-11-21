from pydantic import BaseModel, EmailStr

class SendCodeRequest(BaseModel):
    email: EmailStr

class UserRegister(BaseModel):
    display_name: str
    email: EmailStr
    password: str
    fund_password: str
    code: str
    referral_code: str | None = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ChangePhoneRequest(BaseModel):
    phone: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class ChangeFundPasswordRequest(BaseModel):
    old_fund_password: str
    new_fund_password: str
