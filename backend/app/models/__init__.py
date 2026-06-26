"""Import every model here so SQLAlchemy's metadata sees them all."""
from .exercise import Exercise, ExerciseCompletion
from .social import (
    DirectMessage,
    FriendRequest,
    Friendship,
    Group,
    GroupMember,
    GroupMessage,
)
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
]
