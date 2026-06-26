import datetime as dt

from sqlalchemy import Date, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base


class Exercise(Base):
    """Catalog of exercises shown on the senior home screen."""

    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    duration: Mapped[int] = mapped_column(Integer)
    level: Mapped[str] = mapped_column(String)
    benefit: Mapped[str] = mapped_column(String)
    steps: Mapped[list] = mapped_column(JSON)
    tip: Mapped[str] = mapped_column(String)
    # Logical icon name; the frontend maps it to a lucide-react icon.
    icon: Mapped[str] = mapped_column(String)
    position: Mapped[int] = mapped_column(Integer, default=0)


class ExerciseCompletion(Base):
    """One row per (user, exercise, day) marking an exercise as done."""

    __tablename__ = "exercise_completions"
    __table_args__ = (
        UniqueConstraint("user_id", "exercise_id", "day", name="uq_completion"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"), index=True)
    day: Mapped[dt.date] = mapped_column(Date, index=True)
