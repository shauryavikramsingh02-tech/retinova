"""
Shared pytest fixtures for RetinaCare tests.
Uses a shared in-memory SQLite connection so all sessions in the test process
see the same in-memory database (required because each connection to ':memory:'
normally gets its own isolated database).
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Import Base and ALL models FIRST so their tables are registered before create_all()
from backend.database import Base, get_db
import backend.models  # noqa: F401 — registers Patient & Screening on Base

# Import app AFTER models are registered
from backend.main import app

# :memory: SQLite with StaticPool — all connections share the same in-memory DB instance
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def test_engine():
    """
    Create a shared in-memory SQLite engine with all tables for the test session.
    StaticPool ensures every connect() call returns the same underlying connection,
    so all SQLAlchemy sessions see the same in-memory database instance.
    """
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Create all tables registered on Base (Patient, Screening, …)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def client(test_engine):
    """
    FastAPI TestClient with the database dependency overridden to use
    the shared in-memory test SQLite database.
    """
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    def override_get_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
