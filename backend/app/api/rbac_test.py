from fastapi import APIRouter, Depends

from backend.app.services.roles import require_roles

router = APIRouter(
    prefix="/test",
    tags=["RBAC Test"]
)


@router.get("/citizen-only")
def citizen_only(
    current_user: dict = Depends(require_roles("citizen"))
):
    return {
        "message": "Citizen access granted",
        "user": current_user
    }
