# ================================================================
#  backend/app/schemas/auth.py
#  Request + Response schemas for Auth endpoints
# ================================================================

from pydantic import BaseModel, EmailStr


# ── Request ──────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Response ─────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    full_name: str
    email: str
    role: str


class UserMeResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    department_id: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}