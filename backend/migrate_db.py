"""
RetinaCare Database Migration Script
Adds any missing columns to existing SQLite tables without destroying data.
Run: python backend/migrate_db.py
"""
import sys
import sqlite3
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

DB_PATH = PROJECT_ROOT / "data" / "retinacare.db"

# Expected columns per table: (column_name, column_definition)
REQUIRED_COLUMNS = {
    "screenings": [
        ("left_eye_ai",  "TEXT"),   # stored as JSON string
        ("right_eye_ai", "TEXT"),   # stored as JSON string
        ("overall_predicted_class", "VARCHAR(100)"),
    ]
}

def get_existing_columns(conn: sqlite3.Connection, table: str) -> set:
    cursor = conn.execute(f"PRAGMA table_info({table})")
    return {row[1] for row in cursor.fetchall()}


def migrate():
    if not DB_PATH.exists():
        print(f"[INFO] Database not found at {DB_PATH} — nothing to migrate.")
        return

    print(f"[INFO] Opening database: {DB_PATH}")
    conn = sqlite3.connect(str(DB_PATH))
    try:
        for table, columns in REQUIRED_COLUMNS.items():
            existing = get_existing_columns(conn, table)
            for col_name, col_def in columns:
                if col_name not in existing:
                    sql = f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}"
                    print(f"  [MIGRATE] {sql}")
                    conn.execute(sql)
                    conn.commit()
                    print(f"  [OK] Column '{col_name}' added to '{table}'.")
                else:
                    print(f"  [SKIP] Column '{col_name}' already exists in '{table}'.")
        print("[DONE] Migration complete.")
    finally:
        conn.close()

    # Create any missing SQLAlchemy models and initialize default user accounts
    try:
        from backend.database import engine, SessionLocal, Base
        from backend.models import User, UserSession
        from backend.auth_utils import init_default_users

        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            init_default_users(db)
            print("[AUTH] Default demo accounts initialized (admin, doctor, patient).")
        finally:
            db.close()
    except Exception as e:
        print(f"[AUTH ERROR] Failed initializing default users: {e}")


if __name__ == "__main__":
    migrate()

