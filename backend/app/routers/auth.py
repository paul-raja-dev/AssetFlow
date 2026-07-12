from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ok
from app.dependencies.auth import get_current_user
from app.schemas.auth import (
    AuthUserResponse,
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
)
from app.services import auth_service

router = APIRouter()


@router.post("/signup", status_code=201)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    result = await auth_service.signup(
        db,
        email=body.email,
        password=body.password,
        first_name=body.first_name,
        last_name=body.last_name,
        role=body.role,
    )
    return ok(
        data={
            "user": AuthUserResponse.model_validate(result["user"]).model_dump(by_alias=True),
            "accessToken": result["access_token"],
            "tokenType": "bearer",
        },
        message="Account created successfully",
    )


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await auth_service.login(db, email=body.email, password=body.password)
    return ok(
        data={
            "user": AuthUserResponse.model_validate(result["user"]).model_dump(by_alias=True),
            "accessToken": result["access_token"],
            "tokenType": "bearer",
        },
        message="Login successful",
    )


@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return ok(
        data=AuthUserResponse.model_validate(current_user).model_dump(by_alias=True),
        message="OK",
    )


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    await auth_service.forgot_password(db, email=body.email)
    return ok(message="If that email exists, a reset link has been sent")


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    await auth_service.reset_password(db, token=body.token, new_password=body.new_password)
    return ok(message="Password reset successfully")
