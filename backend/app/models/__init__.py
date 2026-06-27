"""Import every model here so SQLAlchemy's metadata sees them all."""
from .activity import Activity, RunningActivity, RunningActivityCompletion
from .exercise import Exercise, ExerciseCompletion
from .social import (
    DirectMessage,
    FriendRequest,
    Friendship,
    Group,
    GroupMember,
    GroupMessage,
)
from .tutor import Announcement, LiveEvent
from .user import User

__all__ = [
    "User",
    "Exercise",
    "ExerciseCompletion",
    "Friendship",
    "DirectMessage",
    "FriendRequest",
    "Group",
    "GroupMember",
    "GroupMessage",
    "Announcement",
    "LiveEvent",
    "Activity",
    "RunningActivity",
    "RunningActivityCompletion",
]
