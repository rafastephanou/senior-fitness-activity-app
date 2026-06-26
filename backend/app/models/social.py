import datetime as dt

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


class Friendship(Base):
    """Directed friend edge owned by `owner_id` (one row per owner->friend)."""

    __tablename__ = "friendships"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    friend_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    unread: Mapped[int] = mapped_column(Integer, default=0)


class DirectMessage(Base):
    """A 1:1 message between two users."""

    __tablename__ = "direct_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    recipient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    text: Mapped[str] = mapped_column(String)
    time_label: Mapped[str] = mapped_column(String)  # display string, e.g. "09:23"
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)


class FriendRequest(Base):
    """An incoming friend request shown to the recipient (`to_user_id`)."""

    __tablename__ = "friend_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    from_name: Mapped[str] = mapped_column(String)
    from_initials: Mapped[str] = mapped_column(String)
    mutual_group: Mapped[str] = mapped_column(String)
    is_tutor: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String, default="pending")


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    emoji: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    has_live_event: Mapped[bool] = mapped_column(Boolean, default=False)
    member_count: Mapped[int] = mapped_column(Integer, default=0)
    last_message: Mapped[str] = mapped_column(String, default="")
    time_label: Mapped[str] = mapped_column(String, default="")
    unread: Mapped[int] = mapped_column(Integer, default=0)


class GroupMember(Base):
    """A member shown in a group's roster. `user_id` links to a real user when one exists."""

    __tablename__ = "group_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String)
    initials: Mapped[str] = mapped_column(String)
    is_tutor: Mapped[bool] = mapped_column(Boolean, default=False)


class GroupMessage(Base):
    __tablename__ = "group_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), index=True)
    # When the author is a real user we store their id; seeded NPC messages
    # only carry a display name.
    sender_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    sender_name: Mapped[str | None] = mapped_column(String, nullable=True)
    is_tutor: Mapped[bool] = mapped_column(Boolean, default=False)
    text: Mapped[str] = mapped_column(String, default="")
    time_label: Mapped[str] = mapped_column(String)
    # Optional embedded live-event card payload.
    event: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)
