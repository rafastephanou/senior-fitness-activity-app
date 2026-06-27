import datetime as dt

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


class Activity(Base):
    """A reusable activity template the tutor can dispatch ("atividade criada").

    Seeded from the exercise catalog (is_custom=False) and extended with the
    tutor's own custom activities (is_custom=True).
    """

    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    duration: Mapped[int] = mapped_column(Integer)
    level: Mapped[str] = mapped_column(String, default="Fácil")
    icon: Mapped[str] = mapped_column(String, default="star")
    description: Mapped[str] = mapped_column(String, default="")
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)


class RunningActivity(Base):
    """A dispatched activity ("em execução"): a snapshot of a template made
    available to one group. The original template stays in the created list."""

    __tablename__ = "running_activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    activity_id: Mapped[int | None] = mapped_column(ForeignKey("activities.id"), nullable=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), index=True)
    group_name: Mapped[str] = mapped_column(String)
    # Snapshot of the template at dispatch time
    name: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    duration: Mapped[int] = mapped_column(Integer)
    level: Mapped[str] = mapped_column(String, default="Fácil")
    icon: Mapped[str] = mapped_column(String, default="star")
    description: Mapped[str] = mapped_column(String, default="")
    started_label: Mapped[str] = mapped_column(String)
    tutor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)


class RunningActivityCompletion(Base):
    """Marks that a senior completed a running activity."""

    __tablename__ = "running_activity_completions"
    __table_args__ = (
        UniqueConstraint("running_activity_id", "user_id", name="uq_running_completion"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    running_activity_id: Mapped[int] = mapped_column(ForeignKey("running_activities.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)
