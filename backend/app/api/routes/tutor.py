import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...models.activity import Activity, RunningActivity, RunningActivityCompletion
from ...models.exercise import ExerciseCompletion
from ...models.social import Group, GroupMember, GroupMessage
from ...models.tutor import Announcement, LiveEvent
from ...models.user import User
from ...schemas.tutor import (
    AddMemberIn,
    AnnouncementOut,
    CreateActivityIn,
    CreateAnnouncementIn,
    CreatedActivityOut,
    CreateEventIn,
    CreateGroupIn,
    DispatchActivityIn,
    LiveEventOut,
    RunningActivityOut,
    SeniorOut,
    SendEventIn,
    SendMessageIn,
    TutorChatMessageOut,
    TutorGroupOut,
    TutorMemberOut,
)
from ..deps import require_tutor

router = APIRouter(prefix="/tutor", tags=["tutor"], dependencies=[Depends(require_tutor)])


def _today() -> dt.date:
    return dt.datetime.now(dt.timezone.utc).date()


def _now_label() -> str:
    return dt.datetime.now().strftime("Agora, %H:%M")


# ─── Seniors dashboard ────────────────────────────────────────────────────────

@router.get("/seniors", response_model=list[SeniorOut])
def list_seniors(db: Session = Depends(get_db)):
    today = _today()
    seniors = db.scalars(
        select(User).where(User.role == "senior").order_by(User.id)
    ).all()

    out: list[SeniorOut] = []
    for s in seniors:
        days = db.scalars(
            select(ExerciseCompletion.day).where(ExerciseCompletion.user_id == s.id)
        ).all()
        today_count = sum(1 for d in days if d == today)
        week_count = sum(1 for d in days if d >= today - dt.timedelta(days=6))

        day_set = set(days)
        streak = 0
        if day_set:
            last = max(day_set)
            if (today - last).days <= 1:
                cur = last
                while cur in day_set:
                    streak += 1
                    cur = cur - dt.timedelta(days=1)

        if not day_set:
            last_active = "Nunca"
            days_since = 999
        else:
            days_since = (today - max(day_set)).days
            last_active = (
                "Hoje" if days_since == 0 else "Ontem" if days_since == 1 else f"há {days_since} dias"
            )

        alert = None
        if days_since >= 3:
            alert = "Sem atividade recente"
        elif week_count < 3:
            alert = "Pouca atividade esta semana"

        group_names = db.scalars(
            select(Group.name)
            .join(GroupMember, GroupMember.group_id == Group.id)
            .where(GroupMember.user_id == s.id)
        ).all()

        out.append(
            SeniorOut(
                id=s.id,
                name=s.name,
                initials=s.initials,
                age=s.age or 0,
                exercisesThisWeek=week_count,
                exercisesToday=today_count,
                streak=streak,
                lastActive=last_active,
                alert=alert,
                groups=list(group_names),
            )
        )
    return out


# ─── Groups ───────────────────────────────────────────────────────────────────

def _group_messages(db: Session, group_id: int, tutor: User) -> list[TutorChatMessageOut]:
    rows = db.scalars(
        select(GroupMessage)
        .where(GroupMessage.group_id == group_id)
        .order_by(GroupMessage.created_at, GroupMessage.id)
    ).all()
    out = []
    for m in rows:
        if not m.text:
            continue  # skip event-card messages in the tutor chat view
        is_tutor = m.sender_user_id is not None and m.sender_user_id == tutor.id
        if is_tutor:
            sender_name = "Você"
        elif m.sender_name:
            sender_name = m.sender_name
        elif m.sender_user_id is not None:
            u = db.get(User, m.sender_user_id)
            sender_name = u.name if u else "Membro"
        else:
            sender_name = "Membro"
        out.append(
            TutorChatMessageOut(
                id=m.id,
                sender="tutor" if is_tutor else "member",
                senderName=sender_name,
                text=m.text,
                time=m.time_label,
            )
        )
    return out


def _group_members(db: Session, group_id: int) -> list[TutorMemberOut]:
    rows = db.execute(
        select(GroupMember, User)
        .join(User, User.id == GroupMember.user_id)
        .where(GroupMember.group_id == group_id, User.role == "senior")
        .order_by(GroupMember.id)
    ).all()
    return [TutorMemberOut(id=u.id, name=u.name, initials=u.initials) for _gm, u in rows]


def _group_dto(db: Session, group: Group, tutor: User) -> TutorGroupOut:
    return TutorGroupOut(
        id=group.id,
        name=group.name,
        emoji=group.emoji,
        description=group.description or "",
        members=_group_members(db, group.id),
        messages=_group_messages(db, group.id, tutor),
    )


@router.get("/groups", response_model=list[TutorGroupOut])
def list_groups(db: Session = Depends(get_db), tutor: User = Depends(require_tutor)):
    groups = db.scalars(select(Group).order_by(Group.id)).all()
    return [_group_dto(db, g, tutor) for g in groups]


@router.post("/groups", response_model=TutorGroupOut)
def create_group(payload: CreateGroupIn, db: Session = Depends(get_db), tutor: User = Depends(require_tutor)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Nome do grupo é obrigatório")
    group = Group(name=name, emoji=payload.emoji, description=payload.description.strip())
    db.add(group)
    db.commit()
    db.refresh(group)
    return _group_dto(db, group, tutor)


@router.delete("/groups/{group_id}")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    db.execute(delete(GroupMessage).where(GroupMessage.group_id == group_id))
    db.execute(delete(GroupMember).where(GroupMember.group_id == group_id))
    db.delete(group)
    db.commit()
    return {"ok": True}


@router.post("/groups/{group_id}/members", response_model=TutorGroupOut)
def add_member(group_id: int, payload: AddMemberIn, db: Session = Depends(get_db), tutor: User = Depends(require_tutor)):
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    senior = db.get(User, payload.senior_id)
    if senior is None or senior.role != "senior":
        raise HTTPException(status_code=404, detail="Senior not found")

    exists = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id, GroupMember.user_id == senior.id
        )
    )
    if not exists:
        db.add(GroupMember(group_id=group_id, user_id=senior.id, name=senior.name, initials=senior.initials))
        db.commit()
    return _group_dto(db, group, tutor)


@router.delete("/groups/{group_id}/members/{senior_id}", response_model=TutorGroupOut)
def remove_member(group_id: int, senior_id: int, db: Session = Depends(get_db), tutor: User = Depends(require_tutor)):
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    db.execute(
        delete(GroupMember).where(
            GroupMember.group_id == group_id, GroupMember.user_id == senior_id
        )
    )
    db.commit()
    return _group_dto(db, group, tutor)


@router.post("/groups/{group_id}/messages", response_model=TutorChatMessageOut)
def send_group_message(group_id: int, payload: SendMessageIn, db: Session = Depends(get_db), tutor: User = Depends(require_tutor)):
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty message")

    label = dt.datetime.now().strftime("%H:%M")
    msg = GroupMessage(
        group_id=group_id, sender_user_id=tutor.id, sender_name=tutor.name,
        is_tutor=True, text=text, time_label=label,
    )
    db.add(msg)
    group.last_message = f"{tutor.name}: {text}"
    group.time_label = label
    db.commit()
    db.refresh(msg)
    return TutorChatMessageOut(id=msg.id, sender="tutor", senderName="Você", text=msg.text, time=msg.time_label)


# ─── Announcements ────────────────────────────────────────────────────────────

@router.get("/announcements", response_model=list[AnnouncementOut])
def list_announcements(db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Announcement).order_by(Announcement.created_at.desc(), Announcement.id.desc())
    ).all()
    out = []
    for a in rows:
        group_name = None
        if a.group_id:
            g = db.get(Group, a.group_id)
            group_name = g.name if g else None
        out.append(
            AnnouncementOut(
                id=a.id, targetAll=a.target_all, groupId=a.group_id,
                groupName=group_name, text=a.text, time=a.time_label,
            )
        )
    return out


@router.post("/announcements", response_model=AnnouncementOut)
def create_announcement(payload: CreateAnnouncementIn, db: Session = Depends(get_db), tutor: User = Depends(require_tutor)):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty announcement")
    target_all = payload.group_id is None
    group_name = None
    if not target_all:
        g = db.get(Group, payload.group_id)
        if g is None:
            raise HTTPException(status_code=404, detail="Group not found")
        group_name = g.name
    ann = Announcement(
        tutor_id=tutor.id, target_all=target_all, group_id=payload.group_id,
        text=text, time_label=_now_label(),
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return AnnouncementOut(
        id=ann.id, targetAll=ann.target_all, groupId=ann.group_id,
        groupName=group_name, text=ann.text, time=ann.time_label,
    )


# ─── Activities (created templates + dispatch + running) ──────────────────────

ICON_BY_CATEGORY = {
    "Alongamento": "heart",
    "Equilíbrio": "footprints",
    "Cardio": "footprints",
    "Força": "shield",
    "Respiração": "wind",
}


def _senior_member_users(db: Session, group_id: int) -> list[User]:
    return list(db.scalars(
        select(User)
        .join(GroupMember, GroupMember.user_id == User.id)
        .where(GroupMember.group_id == group_id, User.role == "senior")
        .order_by(GroupMember.id)
    ).all())


def _running_out(db: Session, r: RunningActivity) -> RunningActivityOut:
    members = _senior_member_users(db, r.group_id)
    done_ids = set(db.scalars(
        select(RunningActivityCompletion.user_id).where(
            RunningActivityCompletion.running_activity_id == r.id
        )
    ).all())
    completors = [m.name for m in members if m.id in done_ids]
    return RunningActivityOut(
        id=r.id, name=r.name, category=r.category, icon=r.icon, duration=r.duration,
        groupId=r.group_id, groupName=r.group_name, startedLabel=r.started_label,
        completedCount=len(completors), totalMembers=len(members), completors=completors,
    )


@router.get("/activities", response_model=list[CreatedActivityOut])
def list_created_activities(db: Session = Depends(get_db)):
    rows = db.scalars(select(Activity).order_by(Activity.is_custom, Activity.id)).all()
    return [
        CreatedActivityOut(
            id=a.id, name=a.name, category=a.category, duration=a.duration,
            level=a.level, icon=a.icon, description=a.description, isCustom=a.is_custom,
        )
        for a in rows
    ]


@router.post("/activities", response_model=CreatedActivityOut)
def create_activity(payload: CreateActivityIn, db: Session = Depends(get_db), tutor: User = Depends(require_tutor)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Nome da atividade é obrigatório")
    a = Activity(
        name=name, category=payload.category, duration=payload.duration, level="Fácil",
        icon=ICON_BY_CATEGORY.get(payload.category, "star"),
        description=payload.description.strip(), is_custom=True,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return CreatedActivityOut(
        id=a.id, name=a.name, category=a.category, duration=a.duration,
        level=a.level, icon=a.icon, description=a.description, isCustom=a.is_custom,
    )


@router.delete("/activities/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    a = db.get(Activity, activity_id)
    if a is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    if not a.is_custom:
        raise HTTPException(status_code=400, detail="Não é possível excluir atividades do catálogo")
    db.delete(a)
    db.commit()
    return {"ok": True}


@router.post("/activities/{activity_id}/dispatch", response_model=RunningActivityOut)
def dispatch_activity(activity_id: int, payload: DispatchActivityIn, db: Session = Depends(get_db), tutor: User = Depends(require_tutor)):
    a = db.get(Activity, activity_id)
    if a is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    group = db.get(Group, payload.group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    r = RunningActivity(
        activity_id=a.id, group_id=group.id, group_name=group.name,
        name=a.name, category=a.category, duration=a.duration, level=a.level,
        icon=a.icon, description=a.description, started_label=_now_label(), tutor_id=tutor.id,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return _running_out(db, r)


@router.get("/running", response_model=list[RunningActivityOut])
def list_running(db: Session = Depends(get_db)):
    rows = db.scalars(
        select(RunningActivity).order_by(RunningActivity.created_at.desc(), RunningActivity.id.desc())
    ).all()
    return [_running_out(db, r) for r in rows]


@router.delete("/running/{running_id}")
def end_running(running_id: int, db: Session = Depends(get_db)):
    r = db.get(RunningActivity, running_id)
    if r is None:
        raise HTTPException(status_code=404, detail="Running activity not found")
    db.execute(delete(RunningActivityCompletion).where(
        RunningActivityCompletion.running_activity_id == running_id
    ))
    db.delete(r)
    db.commit()
    return {"ok": True}


# ─── Live events ──────────────────────────────────────────────────────────────

def _event_out(e: LiveEvent) -> LiveEventOut:
    return LiveEventOut(
        id=e.id, title=e.title, activityType=e.activity_type, scheduledAt=e.scheduled_at,
        duration=e.duration, description=e.description, status=e.status,
        sentToGroup=e.sent_to_group, sentAt=e.sent_at,
    )


@router.get("/events", response_model=list[LiveEventOut])
def list_events(db: Session = Depends(get_db)):
    rows = db.scalars(select(LiveEvent).order_by(LiveEvent.id)).all()
    return [_event_out(e) for e in rows]


@router.post("/events", response_model=LiveEventOut)
def create_event(payload: CreateEventIn, db: Session = Depends(get_db), tutor: User = Depends(require_tutor)):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Título é obrigatório")
    ev = LiveEvent(
        tutor_id=tutor.id, title=title, activity_type=payload.activityType,
        scheduled_at=payload.scheduledAt or "A definir", duration=payload.duration,
        description=payload.description.strip(), status="saved",
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return _event_out(ev)


@router.post("/events/{event_id}/send", response_model=LiveEventOut)
def send_event(event_id: int, payload: SendEventIn, db: Session = Depends(get_db), tutor: User = Depends(require_tutor)):
    ev = db.get(LiveEvent, event_id)
    if ev is None:
        raise HTTPException(status_code=404, detail="Event not found")
    group = db.get(Group, payload.group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")

    ev.status = "sent"
    ev.sent_to_group = group.name
    ev.sent_at = _now_label()

    # Post the live-event card into the group's chat so seniors see it.
    member_count = len(_group_members(db, group.id))
    label = dt.datetime.now().strftime("%H:%M")
    db.add(GroupMessage(
        group_id=group.id, sender_user_id=tutor.id, sender_name=tutor.name,
        is_tutor=True, text="", time_label=label,
        event={
            "title": ev.title, "activityType": ev.activity_type,
            "participants": member_count, "scheduledAt": ev.scheduled_at, "host": tutor.name,
        },
    ))
    db.commit()
    db.refresh(ev)
    return _event_out(ev)


@router.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    ev = db.get(LiveEvent, event_id)
    if ev is None:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(ev)
    db.commit()
    return {"ok": True}
