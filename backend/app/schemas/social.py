from pydantic import BaseModel


class EventCard(BaseModel):
    title: str
    activityType: str
    participants: int
    scheduledAt: str
    host: str


class MessageOut(BaseModel):
    id: int
    sender: str  # "me" | "them"
    text: str
    time: str
    senderName: str | None = None
    isTutor: bool = False
    event: EventCard | None = None


class FriendOut(BaseModel):
    id: int
    name: str
    avatar: str
    lastMessage: str
    time: str
    unread: int
    isTutor: bool = False
    messages: list[MessageOut] = []


class FriendRequestOut(BaseModel):
    id: int
    name: str
    initials: str
    mutualGroup: str
    isTutor: bool = False


class GroupMemberOut(BaseModel):
    name: str
    initials: str
    isTutor: bool = False


class GroupOut(BaseModel):
    id: int
    name: str
    emoji: str
    members: int
    memberList: list[GroupMemberOut] = []
    lastMessage: str
    time: str
    unread: int
    hasLiveEvent: bool = False
    messages: list[MessageOut] = []


class SendMessageRequest(BaseModel):
    text: str
