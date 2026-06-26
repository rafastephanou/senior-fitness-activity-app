from pydantic import BaseModel


class FriendDone(BaseModel):
    name: str
    avatar: str
    isTutor: bool = False


class ExerciseOut(BaseModel):
    id: int
    name: str
    category: str
    duration: int
    level: str
    icon: str
    benefit: str
    steps: list[str]
    tip: str
    completed: bool = False
    friendsDone: list[FriendDone] = []
