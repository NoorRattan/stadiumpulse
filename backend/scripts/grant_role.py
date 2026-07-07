import argparse
from collections.abc import Sequence

from firebase_admin import auth
from google.cloud import firestore

from dependencies import ensure_firebase_app
from logger import configure_logging, get_logger
from models.user import UserRole
from services.firestore_client import get_firestore_client

logger = get_logger(__name__)


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Grant a StadiumPulse role to a Firebase user.")
    parser.add_argument("uid", help="Firebase Auth UID")
    parser.add_argument("role", choices=[role.value for role in UserRole], help="Role to grant")
    return parser.parse_args(argv)


def get_existing_role_claim(uid: str) -> str | None:
    user = auth.get_user(uid)
    claims = user.custom_claims or {}
    role = claims.get("role")
    return role if isinstance(role, str) else None


def set_role_claim(uid: str, role: UserRole | None) -> None:
    user = auth.get_user(uid)
    claims = dict(user.custom_claims or {})
    if role is None:
        claims.pop("role", None)
    else:
        claims["role"] = role.value
    auth.set_custom_user_claims(uid, claims)


def get_existing_firestore_role(db: firestore.Client, uid: str) -> str | None:
    snapshot = db.collection("users").document(uid).get()
    if not snapshot.exists:
        return None
    role = snapshot.to_dict().get("role")
    return role if isinstance(role, str) else None


def set_firestore_role(db: firestore.Client, uid: str, role: UserRole | None) -> None:
    user_ref = db.collection("users").document(uid)
    if role is None:
        user_ref.update({"role": firestore.DELETE_FIELD})
    else:
        user_ref.set({"role": role.value}, merge=True)


def grant_role(uid: str, role: UserRole, db: firestore.Client) -> None:
    previous_claim_role = get_existing_role_claim(uid)
    previous_firestore_role = get_existing_firestore_role(db, uid)

    set_role_claim(uid, role)
    try:
        set_firestore_role(db, uid, role)
    except Exception:
        rollback_role = UserRole(previous_claim_role) if previous_claim_role in UserRole._value2member_map_ else None
        set_role_claim(uid, rollback_role)
        if previous_firestore_role in UserRole._value2member_map_:
            set_firestore_role(db, uid, UserRole(previous_firestore_role))
        raise


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    configure_logging("INFO")
    ensure_firebase_app()
    db = get_firestore_client()
    grant_role(args.uid, UserRole(args.role), db)
    logger.info("Granted role %s to uid %s", args.role, args.uid)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
