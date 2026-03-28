"""Authentication dependency for protected routes."""

from __future__ import annotations

from fastapi import Request

from app.config import settings


async def verify_token(request: Request) -> dict:
    """FastAPI dependency — currently returns a dev user. Plug in InsForge auth here."""
    if settings.skip_auth:
        return {"sub": "dev-user", "email": "dev@carecompanion.local"}

    # TODO: Verify InsForge JWT token from Authorization header
    return {"sub": "dev-user", "email": "dev@carecompanion.local"}
