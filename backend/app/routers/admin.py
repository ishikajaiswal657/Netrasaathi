from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.audit import AuditLog
from backend.app.models.document import Document
from backend.app.models.user import User
from backend.app.schemas.document import AdminStatsResponse, AuditLogItem
from backend.app.security.dependencies import require_role

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/audit-logs",
    response_model=list[AuditLogItem],
    summary="Retrieve audit trail records"
)
def get_audit_logs(
    action: str | None = Query(None, description="Filter logs by action name (e.g. upload, process, view, ask)"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of audit events to return"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("admin"))
):
    """
    Retrieves system security audit records.
    Restricted strictly to users with the 'admin' role (FR13, FR16).
    Non-admin students receive HTTP 403 Forbidden.
    Guarantees that raw document content, OCR strings, and student questions are never stored or exposed.
    """
    query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
    if action and action.strip().lower() != "all":
        query = query.filter(AuditLog.action == action.strip().lower())

    logs = query.limit(limit).all()

    items = []
    for l in logs:
        user_email = l.user.email if l.user else None
        items.append(
            AuditLogItem(
                id=l.id,
                user_id=l.user_id,
                user_email=user_email,
                action=l.action,
                document_id=l.document_id,
                ip_address=l.ip_address,
                created_at=l.created_at
            )
        )
    return items


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Retrieve high-level system metrics"
)
def get_admin_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("admin"))
):
    """
    Returns aggregate security and operational counts.
    Restricted strictly to users with the 'admin' role.
    """
    total_users = db.query(User).count()
    total_documents = db.query(Document).count()
    total_audit_events = db.query(AuditLog).count()

    tracked_actions = ["upload", "process", "view", "ask"]
    breakdown = {}
    for act in tracked_actions:
        breakdown[act] = db.query(AuditLog).filter(AuditLog.action == act).count()

    return AdminStatsResponse(
        total_users=total_users,
        total_documents=total_documents,
        total_audit_events=total_audit_events,
        action_breakdown=breakdown
    )
