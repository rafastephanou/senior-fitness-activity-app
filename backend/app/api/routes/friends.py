import datetime as dt
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ...core import security
from ...core.database import get_db
from ...models.social import DirectMessage, FriendRequest, Friendship
from ...models.user import User
from ...schemas.social import (
    FriendOut,
    FriendRequestOut,
    MessageOut,
    SendMessageRequest,
)
from ..deps import get_current_user

router = APIRouter(prefix="/friends", tags=["friends"])


def _time_label() -> str:
    return dt.datetime.now().strftime("%H:%M")


def _messages_between(db: Session, me: User, friend: User) -> list[MessageOut]:
    rows = db.scalars(
        select(DirectMessage)
        .where(
            or_(
                (DirectMessage.sender_id == me.id) & (DirectMessage.recipient_id == friend.id),
                (DirectMessage.sender_id == friend.id) & (DirectMessage.recipient_id == me.id),
            )
        )
        .order_by(DirectMessage.created_at, DirectMessage.id)
    ).all()
    friend_is_tutor = friend.role == "tutor"
    out = []
    for m in rows:
        from_me = m.sender_id == me.id
        out.append(
            MessageOut(
                id=m.id,
                sender="me" if from_me else "them",
                text=m.text,
                time=m.time_label,
                isTutor=friend_is_tutor and not from_me,
            )
        )
    return out


def _friend_dto(db: Session, me: User, friendship: Friendship) -> FriendOut:
    friend = db.get(User, friendship.friend_id)
    messages = _messages_between(db, me, friend)
    last = messages[-1] if messages else None
    return FriendOut(
        id=friend.id,
        name=friend.name,
        avatar=friend.initials,
        lastMessage=last.text if last else "",
        time=last.time if last else "",
        unread=friendship.unread,
        isTutor=friend.role == "tutor",
        messages=messages,
    )


@router.get("", response_model=list[FriendOut])
def list_friends(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    friendships = db.scalars(
        select(Friendship).where(Friendship.owner_id == me.id).order_by(Friendship.id)
    ).all()
    return [_friend_dto(db, me, f) for f in friendships]


@router.get("/requests", response_model=list[FriendRequestOut])
def list_requests(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    reqs = db.scalars(
        select(FriendRequest)
        .where(FriendRequest.to_user_id == me.id, FriendRequest.status == "pending")
        .order_by(FriendRequest.id)
    ).all()
    return [
        FriendRequestOut(
            id=r.id,
            name=r.from_name,
            initials=r.from_initials,
            mutualGroup=r.mutual_group,
            isTutor=r.is_tutor,
        )
        for r in reqs
    ]


@router.post("/requests/{request_id}/accept", response_model=FriendOut)
def accept_request(
    request_id: int, db: Session = Depends(get_db), me: User = Depends(get_current_user)
):
    req = db.get(FriendRequest, request_id)
    if req is None or req.to_user_id != me.id:
        raise HTTPException(status_code=404, detail="Request not found")

    # The requester is a seeded NPC with no account — materialise a user for them.
    new_user = User(
        email=f"{req.from_initials.lower()}-{secrets.token_hex(3)}@exemplo.com",
        password_hash=security.hash_password(secrets.token_hex(8)),
        name=req.from_name,
        initials=req.from_initials,
        role="tutor" if req.is_tutor else "senior",
    )
    db.add(new_user)
    db.flush()

    db.add(Friendship(owner_id=me.id, friend_id=new_user.id, unread=0))
    greeting = DirectMessage(
        sender_id=new_user.id,
        recipient_id=me.id,
        text="Oi! Que bom que aceitou meu convite 😊",
        time_label=_time_label(),
    )
    db.add(greeting)
    req.status = "accepted"
    db.commit()

    friendship = db.scalar(
        select(Friendship).where(
            Friendship.owner_id == me.id, Friendship.friend_id == new_user.id
        )
    )
    return _friend_dto(db, me, friendship)


@router.post("/requests/{request_id}/decline")
def decline_request(
    request_id: int, db: Session = Depends(get_db), me: User = Depends(get_current_user)
):
    req = db.get(FriendRequest, request_id)
    if req is None or req.to_user_id != me.id:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "declined"
    db.commit()
    return {"ok": True}


@router.post("/{friend_id}/messages", response_model=MessageOut)
def send_message(
    friend_id: int,
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    friendship = db.scalar(
        select(Friendship).where(
            Friendship.owner_id == me.id, Friendship.friend_id == friend_id
        )
    )
    if friendship is None:
        raise HTTPException(status_code=404, detail="Friend not found")

    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty message")

    msg = DirectMessage(
        sender_id=me.id, recipient_id=friend_id, text=text, time_label=_time_label()
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return MessageOut(id=msg.id, sender="me", text=msg.text, time=msg.time_label)
