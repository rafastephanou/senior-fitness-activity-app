import datetime as dt

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


class Announcement(Base):
    """A message a tutor broadcasts to one group or to everyone."""

    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(primary_key=True)
    tutor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    target_all: Mapped[bool] = mapped_column(Boolean, default=False)
    group_id: Mapped[int | None] = mapped_column(ForeignKey("groups.id"), nullable=True)
    text: Mapped[str] = mapped_column(String)
    time_label: Mapped[str] = mapped_column(String)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)


class LiveEvent(Base):
    """A live activity a tutor creates ("saved") and may broadcast ("sent")."""

    __tablename__ = "live_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    tutor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(String)
    activity_type: Mapped[str] = mapped_column(String)
    scheduled_at: Mapped[str] = mapped_column(String)
    duration: Mapped[int] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="saved")  # saved | sent
    sent_to_group: Mapped[str | None] = mapped_column(String, nullable=True)
    sent_at: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)
