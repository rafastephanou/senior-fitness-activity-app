import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...models.social import Group, GroupMember, GroupMessage
from ...models.user import User
from ...schemas.social import (
    EventCard,
    GroupMemberOut,
    GroupOut,
    MessageOut,
    SendMessageRequest,
)
from ..deps import get_current_user

router = APIRouter(prefix="/groups", tags=["groups"])


def _time_label() -> str:
    return dt.datetime.now().strftime("%H:%M")


def _group_messages(db: Session, group_id: int, me: User) -> list[MessageOut]:
    rows = db.scalars(
        select(GroupMessage)
        .where(GroupMessage.group_id == group_id)
        .order_by(GroupMessage.created_at, GroupMessage.id)
    ).all()
    out = []
    for m in rows:
        from_me = m.sender_user_id is not None and m.sender_user_id == me.id
        out.append(
            MessageOut(
                id=m.id,
                sender="me" if from_me else "them",
                text=m.text,
                time=m.time_label,
                senderName=None if from_me else m.sender_name,
                isTutor=m.is_tutor,
                event=EventCard(**m.event) if m.event else None,
            )
        )
    return out


def _group_dto(db: Session, group: Group, me: User) -> GroupOut:
    members = db.scalars(
        select(GroupMember).where(GroupMember.group_id == group.id).order_by(GroupMember.id)
    ).all()
    return GroupOut(
        id=group.id,
        name=group.name,
        emoji=group.emoji,
        members=group.member_count,
        memberList=[
            GroupMemberOut(name=m.name, initials=m.initials, isTutor=m.is_tutor)
            for m in members
        ],
        lastMessage=group.last_message,
        time=group.time_label,
        unread=group.unread,
        hasLiveEvent=group.has_live_event,
        messages=_group_messages(db, group.id, me),
    )


@router.get("", response_model=list[GroupOut])
def list_groups(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    groups = db.scalars(select(Group).order_by(Group.id)).all()
    return [_group_dto(db, g, me) for g in groups]


@router.post("/{group_id}/messages", response_model=MessageOut)
def send_message(
    group_id: int,
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")

    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty message")

    msg = GroupMessage(
        group_id=group_id,
        sender_user_id=me.id,
        sender_name=me.name,
        text=text,
        time_label=_time_label(),
    )
    db.add(msg)
    group.last_message = f"Você: {text}"
    group.time_label = msg.time_label
    db.commit()
    db.refresh(msg)
    return MessageOut(id=msg.id, sender="me", text=msg.text, time=msg.time_label)
