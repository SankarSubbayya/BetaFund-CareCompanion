"""Service directory, Google Places lookup, and 211 integration."""

from fastapi import APIRouter, Depends

from app.auth import verify_token
from app.database import get_db
from app.services.service_directory import (
    find_services,
    find_services_enhanced,
    find_all_services,
    get_211_info,
)

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("")
async def get_all_services(_user: dict = Depends(verify_token)):
    """Get the full curated service directory."""
    return find_all_services()


@router.get("/211")
async def get_211(_user: dict = Depends(verify_token)):
    """Get 211 Bay Area contact info and services."""
    return get_211_info()


@router.get("/search/{service_type}")
async def search_services(service_type: str, _user: dict = Depends(verify_token)):
    """Enhanced search: curated + Google Places + 211."""
    return await find_services_enhanced(service_type)


@router.get("/{service_type}")
async def get_services_by_type(service_type: str, _user: dict = Depends(verify_token)):
    """Get curated services for a specific request type."""
    services = find_services(service_type)
    return {"type": service_type, "services": services}


@router.get("/recommendations/recent")
async def get_recent_recommendations(_user: dict = Depends(verify_token)):
    """Get recent service recommendations generated from calls."""
    db = get_db()
    recs = db.scan("service_recommendations")
    recs.sort(key=lambda r: r.get("timestamp", ""), reverse=True)
    return recs
