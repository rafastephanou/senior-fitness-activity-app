from pydantic import BaseModel


# ─── Seniors (dashboard) ──────────────────────────────────────────────────────

class SeniorOut(BaseModel):
    id: int
    name: str
    initials: str
    age: int
    exercisesThisWeek: int
    exercisesToday: int
    streak: int
    lastActive: str
    alert: str | None = None
    groups: list[str] = []


# ─── Groups ───────────────────────────────────────────────────────────────────

class TutorMemberOut(BaseModel):
    id: int
    name: str
    initials: str


class TutorChatMessageOut(BaseModel):
    id: int
    sender: str  # "tutor" | "member"
    senderName: str
    text: str
    time: str


class TutorGroupOut(BaseModel):
    id: int
    name: str
    emoji: str
    description: str
    members: list[TutorMemberOut] = []
    messages: list[TutorChatMessageOut] = []


class CreateGroupIn(BaseModel):
    name: str
    emoji: str = "🌟"
    description: str = ""


class AddMemberIn(BaseModel):
    senior_id: int


class SendMessageIn(BaseModel):
    text: str


# ─── Announcements ────────────────────────────────────────────────────────────

class AnnouncementOut(BaseModel):
    id: int
    targetAll: bool
    groupId: int | None = None
    groupName: str | None = None
    text: str
    time: str


class CreateAnnouncementIn(BaseModel):
    text: str
    group_id: int | None = None  # None => broadcast to everyone


# ─── Activities ───────────────────────────────────────────────────────────────

class CreatedActivityOut(BaseModel):
    id: int
    name: str
    category: str
    duration: int
    level: str
    icon: str
    description: str
    isCustom: bool


class CreateActivityIn(BaseModel):
    name: str
    category: str = "Alongamento"
    duration: int = 10
    description: str = ""


class DispatchActivityIn(BaseModel):
    group_id: int


class RunningActivityOut(BaseModel):
    id: int
    name: str
    category: str
    icon: str
    duration: int
    groupId: int
    groupName: str
    startedLabel: str
    completedCount: int
    totalMembers: int
    completors: list[str] = []


# ─── Live events ──────────────────────────────────────────────────────────────

class LiveEventOut(BaseModel):
    id: int
    title: str
    activityType: str
    scheduledAt: str
    duration: int
    description: str
    status: str
    sentToGroup: str | None = None
    sentAt: str | None = None


class CreateEventIn(BaseModel):
    title: str
    activityType: str
    scheduledAt: str = "A definir"
    duration: int = 20
    description: str = ""


class SendEventIn(BaseModel):
    group_id: int
