from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)
    initials: Mapped[str] = mapped_column(String)
    # "senior" or "tutor" — the two roles the app supports.
    role: Mapped[str] = mapped_column(String, default="senior")
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
