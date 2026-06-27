import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...models.activity import RunningActivity, RunningActivityCompletion
from ...models.exercise import Exercise, ExerciseCompletion
from ...models.social import GroupMember
from ...models.user import User
from ...schemas.exercise import AssignedActivityOut, ExerciseOut, FriendDone
from ..deps import get_current_user

router = APIRouter(prefix="/exercises", tags=["exercises"])


def _today() -> dt.date:
    return dt.datetime.now(dt.timezone.utc).date()


@router.get("", response_model=list[ExerciseOut])
def list_exercises(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today = _today()
    exercises = db.scalars(select(Exercise).order_by(Exercise.position)).all()

    # Completions for today, joined with their user, in a single query.
    rows = db.execute(
        select(ExerciseCompletion.exercise_id, User)
        .join(User, User.id == ExerciseCompletion.user_id)
        .where(ExerciseCompletion.day == today)
    ).all()

    mine: set[int] = set()
    friends_by_exercise: dict[int, list[FriendDone]] = {}
    for exercise_id, done_user in rows:
        if done_user.id == user.id:
            mine.add(exercise_id)
        else:
            friends_by_exercise.setdefault(exercise_id, []).append(
                FriendDone(
                    name=done_user.name,
                    avatar=done_user.initials,
                    isTutor=done_user.role == "tutor",
                )
            )

    return [
        ExerciseOut(
            id=ex.id,
            name=ex.name,
            category=ex.category,
            duration=ex.duration,
            level=ex.level,
            icon=ex.icon,
            benefit=ex.benefit,
            steps=ex.steps,
            tip=ex.tip,
            completed=ex.id in mine,
            friendsDone=friends_by_exercise.get(ex.id, []),
        )
        for ex in exercises
    ]


@router.post("/{exercise_id}/toggle")
def toggle_completion(
    exercise_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if db.get(Exercise, exercise_id) is None:
        raise HTTPException(status_code=404, detail="Exercise not found")

    today = _today()
    existing = db.scalar(
        select(ExerciseCompletion).where(
            ExerciseCompletion.user_id == user.id,
            ExerciseCompletion.exercise_id == exercise_id,
            ExerciseCompletion.day == today,
        )
    )
    if existing:
        db.delete(existing)
        db.commit()
        return {"completed": False}

    db.add(ExerciseCompletion(user_id=user.id, exercise_id=exercise_id, day=today))
    db.commit()
    return {"completed": True}


# ─── Tutor-assigned activities (running) seen by the senior ────────────────────

@router.get("/assigned", response_model=list[AssignedActivityOut])
def list_assigned(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    group_ids = db.scalars(
        select(GroupMember.group_id).where(GroupMember.user_id == user.id)
    ).all()
    if not group_ids:
        return []
    rows = db.scalars(
        select(RunningActivity)
        .where(RunningActivity.group_id.in_(group_ids))
        .order_by(RunningActivity.created_at.desc(), RunningActivity.id.desc())
    ).all()
    done = set(db.scalars(
        select(RunningActivityCompletion.running_activity_id).where(
            RunningActivityCompletion.user_id == user.id
        )
    ).all())
    return [
        AssignedActivityOut(
            id=r.id, name=r.name, category=r.category, duration=r.duration,
            level=r.level, icon=r.icon, description=r.description,
            groupName=r.group_name, completed=r.id in done,
        )
        for r in rows
    ]


@router.post("/assigned/{running_id}/toggle")
def toggle_assigned(
    running_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    r = db.get(RunningActivity, running_id)
    if r is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    member = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == r.group_id, GroupMember.user_id == user.id
        )
    )
    if member is None:
        raise HTTPException(status_code=403, detail="Not in this group")

    existing = db.scalar(
        select(RunningActivityCompletion).where(
            RunningActivityCompletion.running_activity_id == running_id,
            RunningActivityCompletion.user_id == user.id,
        )
    )
    if existing:
        db.delete(existing)
        db.commit()
        return {"completed": False}

    db.add(RunningActivityCompletion(running_activity_id=running_id, user_id=user.id))
    db.commit()
    return {"completed": True}
