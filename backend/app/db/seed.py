"""Seed the database with the demo data the app originally hard-coded.

The fully-populated demo account is **maria@exemplo.com** (senior). Logging in
as Maria reproduces the original mock: her friends, groups, messages and the
"friends who did each exercise today" badges.

Seeding is idempotent: it does nothing if any users already exist.
"""
import datetime as dt
import itertools

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core import security
from ..models.exercise import Exercise, ExerciseCompletion
from ..models.social import (
    DirectMessage,
    FriendRequest,
    Friendship,
    Group,
    GroupMember,
    GroupMessage,
)
from ..models.user import User

# Monotonic clock so messages keep their insertion order regardless of labels.
_clock = itertools.count()
_BASE_TIME = dt.datetime(2024, 1, 1, tzinfo=dt.timezone.utc)


def _next_time() -> dt.datetime:
    return _BASE_TIME + dt.timedelta(seconds=next(_clock))


# ── Users ────────────────────────────────────────────────────────────────────
# (email, password, name, initials, role)
USERS = [
    ("maria@exemplo.com", "123456", "Maria Silva", "MS", "senior"),
    ("jose@exemplo.com", "123456", "José Santos", "JS", "senior"),
    ("ana.oliveira@exemplo.com", "123456", "Ana Oliveira", "AO", "senior"),
    ("roberto@exemplo.com", "123456", "Roberto Lima", "RL", "senior"),
    ("joao@exemplo.com", "admin123", "João Oliveira", "JO", "tutor"),
    ("ana@exemplo.com", "admin123", "Ana Tutora", "AT", "tutor"),
    ("carlos@exemplo.com", "admin123", "Carlos Supervisor", "CS", "tutor"),
]

# ── Exercises (catalog) ──────────────────────────────────────────────────────
EXERCISES = [
    ("Alongamento do Pescoço", "Alongamento", 5, "Fácil", "heart", "Alivia tensão e melhora mobilidade",
     ["Sente-se em uma cadeira com as costas eretas e os pés no chão.",
      "Incline lentamente a cabeça para a direita, levando a orelha em direção ao ombro. Segure por 10 segundos.",
      "Volte ao centro e repita para o lado esquerdo. Segure por 10 segundos.",
      "Gire suavemente a cabeça para a direita, olhando por cima do ombro. Segure por 10 segundos.",
      "Repita para o lado esquerdo. Faça 3 repetições de cada lado."],
     "Não force o pescoço. O movimento deve ser suave e sem dor."),
    ("Rotação dos Ombros", "Alongamento", 8, "Fácil", "rotate", "Solta os músculos e melhora postura",
     ["Sente-se ou fique em pé com os braços relaxados ao lado do corpo.",
      "Eleve os ombros em direção às orelhas e role-os para trás em um círculo largo.",
      "Faça 10 rotações para trás, devagar e com controle.",
      "Inverta a direção e faça 10 rotações para a frente.",
      "Ao final, sacuda os braços suavemente para relaxar."],
     "Mantenha a respiração constante durante todo o exercício."),
    ("Equilíbrio em Um Pé", "Equilíbrio", 5, "Moderado", "footprints", "Previne quedas e fortalece tornozelos",
     ["Fique em pé perto de uma parede ou cadeira para apoio de segurança.",
      "Com as mãos levemente apoiadas, levante o pé direito do chão, dobrando o joelho.",
      "Mantenha o equilíbrio por 10 a 30 segundos, olhando para um ponto fixo à frente.",
      "Abaixe o pé com cuidado e repita com o pé esquerdo.",
      "Faça 3 repetições para cada pé, aumentando o tempo gradualmente."],
     "Sempre tenha uma superfície de apoio por perto. Nunca feche os olhos durante este exercício."),
    ("Respiração Profunda", "Respiração", 7, "Fácil", "wind", "Reduz ansiedade e melhora oxigenação",
     ["Sente-se confortavelmente, com as costas eretas e as mãos sobre o colo.",
      "Feche os olhos e inspire lentamente pelo nariz contando até 4.",
      "Segure o ar por 2 segundos.",
      "Expire lentamente pela boca contando até 6, soltando todo o ar.",
      "Repita esse ciclo por 7 minutos, mantendo o ritmo tranquilo."],
     "Tente fazer este exercício pela manhã para começar o dia com calma."),
    ("Caminhada no Lugar", "Cardio", 15, "Fácil", "footprints", "Aquece o corpo e ativa a circulação",
     ["Fique em pé com os pés afastados na largura dos quadris, próximo a uma parede para segurança.",
      "Levante o joelho direito até a altura do quadril e abaixe. Repita com o esquerdo.",
      "Balance os braços naturalmente, como se estivesse caminhando de verdade.",
      "Mantenha um ritmo confortável por 15 minutos. Descanse 1 minuto se precisar.",
      "Ao terminar, respire fundo 3 vezes e caminhe devagar por 1 minuto para desaquecer."],
     "Use calçados confortáveis e antiderrapantes. Pare se sentir tontura."),
    ("Flexão dos Joelhos", "Força", 10, "Moderado", "shield", "Fortalece pernas e melhora sustentação",
     ["Fique em pé atrás de uma cadeira resistente, segurando o encosto com as duas mãos.",
      "Afaste os pés na largura dos ombros, com os dedos apontados levemente para fora.",
      "Dobre os joelhos lentamente, como se fosse sentar, descendo até sentir conforto (não passe 90°).",
      "Suba lentamente, contraindo os glúteos. Não trave os joelhos ao subir.",
      "Faça 3 séries de 10 repetições, descansando 1 minuto entre cada série."],
     "Os joelhos não devem ultrapassar a ponta dos pés. Vá devagar e com controle."),
    ("Alongamento das Costas", "Alongamento", 8, "Fácil", "heart", "Alivia dores lombares e relaxa a coluna",
     ["Sente-se no meio de uma cadeira firme, com os pés no chão e joelhos dobrados a 90°.",
      "Cruze os braços sobre o peito e incline o tronco para a frente, em direção às coxas.",
      "Segure por 10 segundos sentindo o alongamento nas costas.",
      "Volte lentamente à posição inicial usando os músculos abdominais.",
      "Repita 5 vezes. Para variar, incline levemente para os lados também."],
     "Se sentir dor aguda nas costas, pare imediatamente e consulte um médico."),
    ("Elevação dos Braços", "Força", 10, "Fácil", "star", "Fortalece ombros e melhora alcance",
     ["Sente-se com as costas eretas, pés no chão. Segure uma garrafa de água em cada mão (opcional).",
      "Com os braços ao lado do corpo, levante ambos os braços lateralmente até a altura dos ombros.",
      "Segure por 2 segundos na posição elevada e desça lentamente.",
      "Faça o mesmo movimento elevando os braços à frente do corpo.",
      "Faça 3 séries de 10 repetições de cada variação, descansando entre as séries."],
     "Comece sem peso. Adicione a garrafa d'água somente quando sentir facilidade."),
]

# Which friends already did each exercise today (by exercise position 1..8),
# referenced by user initials. Maria (MS) is excluded since she is the viewer.
FRIENDS_DONE = {
    1: ["AO"],
    2: [],
    3: ["RL", "AO"],
    4: ["JS", "JO"],
    5: ["AO", "JO"],
    6: [],
    7: ["RL"],
    8: ["JS"],
}

# ── Maria's direct-message threads (friend initials -> (unread, messages)) ────
# Each message: (who, text, time)  where who is "me" (Maria) or "them" (friend).
FRIEND_THREADS = {
    "JS": (0, [
        ("them", "Oi! Fez os exercícios de ontem?", "16:40"),
        ("me", "Fiz sim! Fiquei um pouco cansado mas valeu.", "16:55"),
        ("them", "Como você está se sentindo?", "17:02"),
    ]),
    "AO": (1, [
        ("me", "Ana, que tal a gente fazer os exercícios juntas?", "14:20"),
        ("them", "Que ótima ideia!", "14:35"),
        ("them", "Vamos fazer a caminhada juntas amanhã?", "14:36"),
    ]),
    "RL": (0, [
        ("me", "Roberto, experimentou o alongamento das costas?", "10:00"),
        ("them", "Sim! Ficou muito melhor.", "10:45"),
        ("them", "Obrigado pela dica de exercício!", "10:46"),
    ]),
    "JO": (1, [
        ("them", "Bom dia! Como você está se sentindo hoje?", "08:10"),
        ("me", "Bom dia João! Estou bem, obrigada!", "08:13"),
        ("them", "Lembre-se de fazer os exercícios hoje! 💪", "08:15"),
    ]),
}

FRIEND_REQUESTS = [
    ("Carmen Souza", "CS", "Turma da Manhã", False),
    ("Paulo Ferreira", "PF", "Viz. Alegre", False),
]

# ── Groups ───────────────────────────────────────────────────────────────────
# Each message: (who, text, time, senderName, isTutor, event)
GROUPS = [
    {
        "name": "Turma da Manhã", "emoji": "🌅", "member_count": 12, "unread": 5,
        "has_live_event": True, "last_message": "João (Tutor): Ótimo trabalho hoje!", "time": "08:20",
        "members": [("João Oliveira", "JO", True), ("Maria Silva", "MS", False), ("Ana Oliveira", "AO", False),
                    ("Roberto Lima", "RL", False), ("Carmen Souza", "CS", False), ("Lúcia Mendes", "LM", False),
                    ("Paulo Ferreira", "PF", False), ("Beatriz Costa", "BC", False), ("Antônio Ramos", "AR", False),
                    ("Helena Vieira", "HV", False), ("Francisco Lima", "FL", False), ("Tereza Neves", "TN", False)],
        "messages": [
            ("them", "Bom dia turma! Prontos para os exercícios?", "08:00", "Carmen", False, None),
            ("me", "Prontos! Vamos lá! 💪", "08:04", None, False, None),
            ("them", "Bom dia a todos!", "08:07", "Carmen", False, None),
            ("them", "Ótimo trabalho hoje! Continuem assim, estou acompanhando o progresso de vocês 🌟", "08:20", "João Oliveira", True, None),
            ("them", "", "08:25", "João Oliveira", True,
             {"title": "Alongamento Matinal em Grupo", "activityType": "Alongamento", "participants": 8, "scheduledAt": "Hoje às 09:00", "host": "João Oliveira"}),
        ],
    },
    {
        "name": "Saúde em Família", "emoji": "❤️", "member_count": 8, "unread": 1,
        "has_live_event": False, "last_message": "Filha: Mamãe, lembrou de beber água?", "time": "11:30",
        "members": [("João Oliveira", "JO", True), ("José Santos", "JS", False), ("Roberto Lima", "RL", False),
                    ("Fernanda Santos", "FS", False), ("Ricardo Oliveira", "RO", False), ("Mariana Costa", "MC", False),
                    ("Sandra Lima", "SL", False), ("Carlos Mendes", "CM", False)],
        "messages": [
            ("them", "Mamãe fez os exercícios hoje?", "10:00", None, False, None),
            ("me", "Fiz sim minha filha! Tô muito bem.", "10:30", None, False, None),
            ("them", "Filha: Mamãe, lembrou de beber água?", "11:30", None, False, None),
        ],
    },
    {
        "name": "Viz. Alegre", "emoji": "🏠", "member_count": 24, "unread": 0,
        "has_live_event": False, "last_message": "Dona Lúcia: Amanhã tem aula de yoga!", "time": "Ontem",
        "members": [("João Oliveira", "JO", True), ("Maria Silva", "MS", False), ("José Santos", "JS", False),
                    ("Lúcia Mendes", "LM", False), ("Paulo Ferreira", "PF", False), ("Clara Rocha", "CR", False),
                    ("Davi Alves", "DA", False), ("Elisa Pinto", "EP", False), ("Fábio Cunha", "FC", False),
                    ("Glória Teixeira", "GT", False), ("Hugo Barbosa", "HB", False), ("Ivone Castro", "IC", False),
                    ("Jorge Moura", "JM", False), ("Kátia Lopes", "KL", False)],
        "messages": [
            ("them", "Pessoal, alguém fez a caminhada hoje?", "09:00", None, False, None),
            ("me", "Eu fiz! Meia hora no parque.", "09:30", None, False, None),
            ("them", "Dona Lúcia: Amanhã tem aula de yoga!", "10:15", None, False, None),
        ],
    },
    {
        "name": "Clube Ativo 60+", "emoji": "🌟", "member_count": 31, "unread": 0,
        "has_live_event": False, "last_message": "Coordenador: Parabéns a todos!", "time": "Seg",
        "members": [("Ana Tutora", "AT", True), ("João Oliveira", "JO", True), ("Ana Oliveira", "AO", False),
                    ("Roberto Lima", "RL", False), ("Tereza Neves", "TN", False), ("Benedito Souza", "BS", False),
                    ("Conceição Ramos", "CR", False), ("Dalva Pereira", "DP", False), ("Edson Melo", "EM", False),
                    ("Fátima Gomes", "FG", False)],
        "messages": [
            ("them", "Vocês estão arrasando nos exercícios!", "15:00", None, False, None),
            ("me", "Obrigada! Cada dia melhorando.", "15:20", None, False, None),
            ("them", "Coordenador: Parabéns a todos!", "16:00", None, False, None),
        ],
    },
]


def seed(db: Session) -> None:
    if db.scalar(select(User).limit(1)) is not None:
        return  # already seeded

    # Users
    users: dict[str, User] = {}  # keyed by initials
    for email, password, name, initials, role in USERS:
        u = User(
            email=email,
            password_hash=security.hash_password(password),
            name=name,
            initials=initials,
            role=role,
        )
        db.add(u)
        users[initials] = u
    db.flush()
    maria = users["MS"]

    # Exercises
    exercises: list[Exercise] = []
    for i, (name, cat, dur, level, icon, benefit, steps, tip) in enumerate(EXERCISES, start=1):
        ex = Exercise(name=name, category=cat, duration=dur, level=level, icon=icon,
                      benefit=benefit, steps=steps, tip=tip, position=i)
        db.add(ex)
        exercises.append(ex)
    db.flush()

    # Friends-did-this-today completions
    today = dt.datetime.now(dt.timezone.utc).date()
    for pos, initials_list in FRIENDS_DONE.items():
        ex = exercises[pos - 1]
        for initials in initials_list:
            db.add(ExerciseCompletion(user_id=users[initials].id, exercise_id=ex.id, day=today))

    # Maria's friendships + direct messages
    for initials, (unread, messages) in FRIEND_THREADS.items():
        friend = users[initials]
        db.add(Friendship(owner_id=maria.id, friend_id=friend.id, unread=unread))
        for who, text, time_label in messages:
            sender, recipient = (maria, friend) if who == "me" else (friend, maria)
            db.add(DirectMessage(
                sender_id=sender.id, recipient_id=recipient.id,
                text=text, time_label=time_label, created_at=_next_time(),
            ))

    # Friend requests addressed to Maria
    for name, initials, mutual, is_tutor in FRIEND_REQUESTS:
        db.add(FriendRequest(
            to_user_id=maria.id, from_name=name, from_initials=initials,
            mutual_group=mutual, is_tutor=is_tutor, status="pending",
        ))

    # Groups
    for g in GROUPS:
        group = Group(
            name=g["name"], emoji=g["emoji"], member_count=g["member_count"],
            unread=g["unread"], has_live_event=g["has_live_event"],
            last_message=g["last_message"], time_label=g["time"],
        )
        db.add(group)
        db.flush()
        for name, initials, is_tutor in g["members"]:
            member_user = users.get(initials)
            db.add(GroupMember(
                group_id=group.id,
                user_id=member_user.id if member_user and member_user.name == name else None,
                name=name, initials=initials, is_tutor=is_tutor,
            ))
        for who, text, time_label, sender_name, is_tutor, event in g["messages"]:
            db.add(GroupMessage(
                group_id=group.id,
                sender_user_id=maria.id if who == "me" else None,
                sender_name=None if who == "me" else sender_name,
                is_tutor=is_tutor, text=text, time_label=time_label,
                event=event, created_at=_next_time(),
            ))

    db.commit()
