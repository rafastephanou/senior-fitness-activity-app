import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from . import models  # noqa: F401 — registers all models on Base.metadata
from .api.routes import auth, exercises, friends, groups, tutor
from .core.config import settings
from .core.database import Base, SessionLocal, engine
from .db.seed import seed


def _wait_for_db(retries: int = 30, delay: float = 1.0) -> None:
    """Postgres may still be starting when the API boots; retry briefly."""
    for attempt in range(retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except OperationalError:
            if attempt == retries - 1:
                raise
            time.sleep(delay)


@asynccontextmanager
async def lifespan(app: FastAPI):
    _wait_for_db()
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(title="Senior Fitness API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(exercises.router, prefix=API_PREFIX)
app.include_router(friends.router, prefix=API_PREFIX)
app.include_router(groups.router, prefix=API_PREFIX)
app.include_router(tutor.router, prefix=API_PREFIX)


@app.get("/health")
def health():
    return {"status": "ok"}


# Serve the built React app so a single service hosts both API and UI (the cloud
# demo). Mounted last so it only catches paths the API didn't. In local dev the
# frontend runs separately under Vite, so this directory won't exist and is skipped.
_static_dir = os.environ.get(
    "STATIC_DIR", os.path.join(os.path.dirname(__file__), "..", "static")
)
if os.path.isdir(_static_dir):
    app.mount("/", StaticFiles(directory=_static_dir, html=True), name="spa")
