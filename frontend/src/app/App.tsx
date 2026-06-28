import { useState, useRef, useEffect } from "react";
import {
  Dumbbell,
  MessageCircle,
  Users,
  Check,
  Clock,
  ChevronLeft,
  Send,
  Heart,
  Star,
  Wind,
  Footprints,
  Shield,
  RotateCcw,
  Search,
  Video,
  CalendarClock,
  X,
  Play,
  UserPlus,
  LogOut,
} from "lucide-react";
import { LoginScreen } from "./components/LoginScreen";
import { TutorApp } from "./components/TutorApp";
import { api, getToken, setToken } from "../lib/api";
import type {
  SessionUser,
  Exercise,
  Message,
  Friend,
  FriendRequest,
  Group,
  GroupMemberEntry,
  AssignedActivity,
} from "../lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = "exercises" | "friends" | "groups";

// Maps an exercise's logical icon name (from the API) to a lucide icon.
function ExerciseIcon({ name, size = 22 }: { name: string; size?: number }) {
  switch (name) {
    case "heart":
      return <Heart size={size} />;
    case "rotate":
      return <RotateCcw size={size} />;
    case "footprints":
      return <Footprints size={size} />;
    case "wind":
      return <Wind size={size} />;
    case "shield":
      return <Shield size={size} />;
    case "star":
      return <Star size={size} />;
    default:
      return <Dumbbell size={size} />;
  }
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const categoryColors: Record<string, string> = {
  Alongamento: "bg-[#FFF0EB] text-[#D95C35]",
  Equilíbrio: "bg-[#EBF5ED] text-[#3D6B45]",
  Cardio: "bg-[#FFF8EB] text-[#B37A10]",
  Força: "bg-[#EEF0FF] text-[#4A52B2]",
  Respiração: "bg-[#EBF5F8] text-[#1E7490]",
};

const avatarColors = [
  "bg-[#F5C5B2] text-[#8B3A20]",
  "bg-[#B8D9BD] text-[#2A5C33]",
  "bg-[#C8C0E0] text-[#3D2A72]",
  "bg-[#F9E0C0] text-[#7A4A10]",
];

// ─── Shared sub-components ────────────────────────────────────────────────────

function Avatar({ initials, size = "md", index = 0 }: { initials: string; size?: "sm" | "md" | "lg"; index?: number }) {
  const sz = size === "sm" ? "w-10 h-10 text-sm" : size === "lg" ? "w-14 h-14 text-xl" : "w-12 h-12 text-base";
  const color = avatarColors[index % avatarColors.length];
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center font-semibold shrink-0`}>
      {initials}
    </div>
  );
}

function ExerciseModal({ exercise, completed, onToggle, onClose }: { exercise: Exercise; completed: boolean; onToggle: () => void; onClose: () => void }) {
  const friends = exercise.friendsDone ?? [];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Card */}
      <div className="relative bg-background rounded-3xl w-full shadow-2xl overflow-hidden">
        {/* X button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-9 h-9 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors"
        >
          <X size={18} className="text-white" />
        </button>

        {/* Mock video */}
        <div className="relative w-full bg-[#1C2A1E] flex items-center justify-center" style={{ height: 200 }}>
          {/* Background pattern to suggest video frame */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #4E7E57 0%, transparent 60%), radial-gradient(circle at 75% 40%, #2C5C35 0%, transparent 50%)" }} />
          <div className="absolute inset-0 flex items-end p-4">
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 rounded-full" style={{ width: "35%" }} />
            </div>
          </div>
          <button className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
            <Play size={24} className="text-[#1C2A1E] ml-1" fill="currentColor" />
          </button>
          <div className="absolute bottom-8 left-4">
            <p className="text-white/80 text-xs font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{exercise.duration} min · Tutorial</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pt-4 pb-5 space-y-4">
          {/* Name */}
          <h2 className="text-foreground leading-tight" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.35rem", fontWeight: 700 }}>
            {exercise.name}
          </h2>

          {/* Friends */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2.5">Amigos que já fizeram hoje</p>
            {friends.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum amigo fez ainda. Seja o primeiro! 🌟</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {friends.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-muted rounded-2xl px-3 py-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${f.isTutor ? "bg-[#EEF0FF] text-[#4A52B2]" : avatarColors[idx % avatarColors.length]}`}>
                      {f.avatar}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{f.name.split(" ")[0]}</span>
                    {f.isTutor && <span className="text-xs text-[#4A52B2] font-medium">Tutor</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => { onToggle(); onClose(); }}
            className={`w-full py-4 rounded-2xl font-semibold text-base transition-all active:scale-[0.98] ${
              completed
                ? "bg-muted text-muted-foreground border-2 border-border"
                : "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
            }`}
          >
            {completed ? "Marcar como não feito" : "Marcar como concluído ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExercisesView({ exercises, onToggle, userName, assigned, onToggleAssigned }: { exercises: Exercise[]; onToggle: (id: number) => void; userName: string; assigned: AssignedActivity[]; onToggleAssigned: (id: number) => void }) {
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const categories = ["Todos", "Alongamento", "Equilíbrio", "Cardio", "Força", "Respiração"];
  const filtered = filter === "Todos" ? exercises : exercises.filter((e) => e.category === filter);
  const doneCount = exercises.filter((e) => e.completed).length;
  const progress = exercises.length ? (doneCount / exercises.length) * 100 : 0;

  // Keep the open modal in sync with refreshed exercise data.
  const selectedExercise = selected ? exercises.find((e) => e.id === selected.id) ?? selected : null;

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {selectedExercise && (
        <ExerciseModal
          exercise={selectedExercise}
          completed={selectedExercise.completed}
          onToggle={() => onToggle(selectedExercise.id)}
          onClose={() => setSelected(null)}
        />
      )}
      <div className="px-5 pt-6 pb-4 shrink-0">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Hoje, {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-3xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
          Bom dia, {userName.split(" ")[0]}! 🌤️
        </h1>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <span className="text-muted-foreground">Progresso do dia</span>
            <span className="font-semibold text-primary">{doneCount} de {exercises.length} atividades</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <div className="px-5 pb-3 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${filter === cat ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground border border-border"}`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
        {assigned.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#4A52B2] uppercase tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Atividades do seu tutor
            </p>
            {assigned.map((a) => {
              const done = a.completed;
              return (
                <div
                  key={`assigned-${a.id}`}
                  className={`w-full text-left rounded-2xl p-4 border transition-all duration-200 ${done ? "border-secondary/30 bg-[#F4FAF5]" : "border-[#4A52B2]/25 bg-[#F7F8FF]"}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${done ? "bg-secondary text-white" : "bg-[#EEF0FF] text-[#4A52B2]"}`}>
                      {done ? <Check size={22} /> : <ExerciseIcon name={a.icon} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-semibold leading-tight ${done ? "text-muted-foreground line-through" : "text-foreground"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1rem" }}>
                          {a.name}
                        </h3>
                        <button
                          onClick={() => onToggleAssigned(a.id)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? "bg-secondary border-secondary text-white" : "border-[#4A52B2]/40 bg-background hover:border-[#4A52B2]"}`}
                        >
                          {done && <Check size={14} />}
                        </button>
                      </div>
                      {a.description && (
                        <p className="text-muted-foreground text-sm mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{a.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <Clock size={14} />{a.duration} min
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EEF0FF] text-[#4A52B2]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          do tutor · {a.groupName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="border-t border-border" />
          </div>
        )}
        {filtered.map((ex) => {
          const done = ex.completed;
          const doneFriends = ex.friendsDone ?? [];
          return (
            <div
              key={ex.id}
              onClick={() => setSelected(ex)}
              className={`w-full text-left bg-card rounded-2xl p-4 border transition-all duration-200 hover:shadow-sm active:scale-[0.99] cursor-pointer ${done ? "border-secondary/30 bg-[#F4FAF5]" : "border-border"}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${done ? "bg-secondary text-white" : categoryColors[ex.category] || "bg-muted text-muted-foreground"}`}>
                  {done ? <Check size={22} /> : <ExerciseIcon name={ex.icon} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-semibold leading-tight ${done ? "text-muted-foreground line-through" : "text-foreground"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1rem" }}>
                      {ex.name}
                    </h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggle(ex.id); }}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? "bg-secondary border-secondary text-white" : "border-border bg-background hover:border-primary"}`}
                    >
                      {done && <Check size={14} />}
                    </button>
                  </div>
                  <p className="text-muted-foreground text-sm mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ex.benefit}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <Clock size={14} />{ex.duration} min
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColors[ex.category] || "bg-muted text-muted-foreground"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {ex.level}
                      </span>
                    </div>
                    {doneFriends.length > 0 && (
                      <div className="flex -space-x-1.5">
                        {doneFriends.slice(0, 3).map((f, i) => (
                          <div key={i} className={`w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold ${f.isTutor ? "bg-[#EEF0FF] text-[#4A52B2]" : avatarColors[i % avatarColors.length]}`}>
                            {f.avatar[0]}
                          </div>
                        ))}
                        {doneFriends.length > 3 && (
                          <div className="w-6 h-6 rounded-full border-2 border-card bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">
                            +{doneFriends.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatView({ name, initials, avatarIndex, messages, onBack, onSend, memberList, friendNames, pendingInvites, onInvite, currentUserName }: {
  name: string; initials: string; avatarIndex: number; messages: Message[];
  onBack: () => void; onSend: (text: string) => void;
  memberList?: GroupMemberEntry[];
  friendNames?: Set<string>;
  pendingInvites?: Set<string>;
  onInvite?: (name: string) => void;
  currentUserName?: string;
}) {
  const [input, setInput] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    const t = input.trim();
    if (!t) return;
    onSend(t);
    setInput("");
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* Members modal */}
      {showMembers && memberList && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMembers(false)} />
          <div className="relative bg-background rounded-3xl w-full shadow-2xl overflow-hidden max-h-[80%] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.2rem" }}>
                  Membros do grupo
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {memberList.length} participantes
                </p>
              </div>
              <button
                onClick={() => setShowMembers(false)}
                className="w-9 h-9 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            {/* List */}
            <div className="overflow-y-auto px-5 py-3 space-y-2">
              {memberList.map((m, idx) => {
                const isMe = m.name === currentUserName;
                const isFriend = isMe || (friendNames?.has(m.name) ?? false);
                const isPending = !isFriend && (pendingInvites?.has(m.name) ?? false);
                return (
                  <div key={idx} className={`flex items-center gap-3 px-3 py-3 rounded-2xl ${m.isTutor ? "bg-[#EEF0FF]" : "bg-muted"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${m.isTutor ? "bg-[#4A52B2] text-white" : avatarColors[idx % avatarColors.length]}`}>
                      {m.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {m.name}{isMe && <span className="text-xs text-muted-foreground font-normal ml-1">(você)</span>}
                      </p>
                      {m.isTutor && (
                        <p className="text-xs text-[#4A52B2] font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tutor</p>
                      )}
                    </div>
                    {/* Right side action */}
                    {isMe ? null : isFriend ? (
                      <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-secondary bg-[#EBF5ED] px-2.5 py-1 rounded-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <Check size={12} /> Amigo
                      </span>
                    ) : isPending ? (
                      <span className="shrink-0 text-xs font-semibold text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Convite enviado
                      </span>
                    ) : (
                      <button
                        onClick={() => onInvite?.(m.name)}
                        className="shrink-0 flex items-center gap-1 text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-full hover:opacity-90 active:scale-95 transition-all"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        <UserPlus size={13} /> Convidar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-4 bg-card border-b border-border shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-foreground">
          <ChevronLeft size={24} />
        </button>
        <Avatar initials={initials} size="sm" index={avatarIndex} />
        <div className="flex-1 min-w-0">
          {memberList ? (
            <button
              onClick={() => setShowMembers(true)}
              className="text-left hover:opacity-70 transition-opacity"
            >
              <p className="font-semibold text-foreground underline decoration-dotted underline-offset-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{name}</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{memberList.length} membros · toque para ver</p>
            </button>
          ) : (
            <div>
              <p className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{name}</p>
              <p className="text-xs text-secondary" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>● Online</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          if (msg.event) {
            const ev = msg.event;
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="w-full max-w-[92%] rounded-2xl overflow-hidden border border-[#4A52B2]/25 shadow-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {/* Header band */}
                  <div className="bg-[#4A52B2] px-4 py-3 flex items-center gap-2">
                    <Video size={16} className="text-white shrink-0" />
                    <p className="text-xs font-semibold text-white uppercase tracking-wide">Evento ao vivo</p>
                    <span className="ml-auto flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                      <span className="text-xs text-white/80 font-medium">Em breve</span>
                    </span>
                  </div>
                  {/* Body */}
                  <div className="bg-[#F7F8FF] px-4 py-4">
                    <p className="text-xs font-semibold text-[#4A52B2] mb-1">{msg.senderName} (Tutor)</p>
                    <h3 className="text-foreground font-bold leading-snug mb-3" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.1rem" }}>
                      {ev.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-white rounded-xl px-3 py-2 border border-[#4A52B2]/10">
                        <p className="text-xs text-muted-foreground mb-0.5">Atividade</p>
                        <p className="text-sm font-semibold text-foreground">{ev.activityType}</p>
                      </div>
                      <div className="bg-white rounded-xl px-3 py-2 border border-[#4A52B2]/10">
                        <p className="text-xs text-muted-foreground mb-0.5">Participantes</p>
                        <p className="text-sm font-semibold text-foreground">{ev.participants} inscritos</p>
                      </div>
                      <div className="bg-white rounded-xl px-3 py-2 border border-[#4A52B2]/10">
                        <p className="text-xs text-muted-foreground mb-0.5">Horário</p>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1"><CalendarClock size={13} className="text-[#4A52B2]" />{ev.scheduledAt}</p>
                      </div>
                      <div className="bg-white rounded-xl px-3 py-2 border border-[#4A52B2]/10">
                        <p className="text-xs text-muted-foreground mb-0.5">Tutor</p>
                        <p className="text-sm font-semibold text-foreground">{ev.host}</p>
                      </div>
                    </div>
                    <button className="w-full py-3 bg-[#4A52B2] text-white rounded-xl font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      <Video size={18} />
                      Ingressar
                    </button>
                    <p className="text-xs text-muted-foreground text-center mt-2">{msg.time}</p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] px-4 py-3 rounded-2xl text-base leading-relaxed ${
                  msg.sender === "me"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : msg.isTutor
                    ? "bg-[#EEF0FF] text-card-foreground border border-[#4A52B2]/20 rounded-tl-sm"
                    : "bg-card text-card-foreground border border-border rounded-tl-sm"
                }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {msg.sender === "them" && msg.senderName && (
                  <p className={`text-xs font-semibold mb-1 ${msg.isTutor ? "text-[#4A52B2]" : "text-muted-foreground"}`}>
                    {msg.isTutor ? `${msg.senderName} (Tutor)` : msg.senderName}
                  </p>
                )}
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 py-3 bg-card border-t border-border shrink-0">
        <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Escreva uma mensagem..." className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
          <button onClick={handleSend} disabled={!input.trim()} className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FriendsView({ autoOpenTutor, onAutoOpenHandled }: { autoOpenTutor?: boolean; onAutoOpenHandled?: () => void }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listFriends(), api.listFriendRequests()])
      .then(([fs, rs]) => { setFriends(fs); setRequests(rs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openChat = (friend: Friend) => {
    setFriends((prev) => prev.map((f) => (f.id === friend.id ? { ...f, unread: 0 } : f)));
    setActiveFriend({ ...friend, unread: 0 });
  };

  useEffect(() => {
    if (!autoOpenTutor || loading) return;
    const tutor = friends.find((f) => f.isTutor);
    if (tutor) openChat(tutor);
    onAutoOpenHandled?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenTutor, loading]);

  const acceptRequest = async (req: FriendRequest) => {
    try {
      const newFriend = await api.acceptFriendRequest(req.id);
      setFriends((prev) => [newFriend, ...prev]);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch {
      /* ignore */
    }
  };

  const declineRequest = async (id: number) => {
    try {
      await api.declineFriendRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      /* ignore */
    }
  };

  const sendMessage = async (text: string) => {
    if (!activeFriend) return;
    try {
      const msg = await api.sendFriendMessage(activeFriend.id, text);
      const updated = { ...activeFriend, messages: [...activeFriend.messages, msg], lastMessage: msg.text, time: msg.time };
      setActiveFriend(updated);
      setFriends((prev) => prev.map((f) => (f.id === activeFriend.id ? updated : f)));
    } catch {
      /* ignore */
    }
  };

  if (activeFriend) {
    const idx = friends.findIndex((f) => f.id === activeFriend.id);
    return <ChatView name={activeFriend.name} initials={activeFriend.avatar} avatarIndex={idx} messages={activeFriend.messages} onBack={() => setActiveFriend(null)} onSend={sendMessage} />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-6 pb-4 shrink-0">
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Amigos</h1>
        <p className="text-muted-foreground mt-1 text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Converse com quem você gosta</p>
        <div className="mt-4 flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input placeholder="Buscar amigo..." className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">
        {loading && (
          <p className="text-muted-foreground text-sm text-center pt-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Carregando...</p>
        )}
        {/* Friend requests section */}
        {requests.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.95rem" }}>
                Convites de amizade
              </h2>
              <span className="w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {requests.length}
              </span>
            </div>
            <div className="space-y-2">
              {requests.map((req, idx) => (
                <div key={req.id} className="bg-[#FFF8F5] border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold shrink-0 text-base ${avatarColors[idx % avatarColors.length]}`}>
                    {req.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{req.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Grupo em comum: {req.mutualGroup}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => acceptRequest(req)}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Aceitar
                    </button>
                    <button
                      onClick={() => declineRequest(req.id)}
                      className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-semibold rounded-xl hover:bg-border transition-colors"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-border" />
          </div>
        )}

        {/* Friends list */}
        <div className="space-y-2">
          {requests.length === 0 && !loading && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Seus amigos
            </p>
          )}
          {friends.map((friend, idx) => (
            <button
              key={friend.id}
              onClick={() => openChat(friend)}
              className={`w-full bg-card rounded-2xl p-4 border flex items-center gap-4 transition-all text-left ${
                friend.isTutor
                  ? "border-[#4A52B2]/25 hover:border-[#4A52B2]/50 hover:bg-[#F5F6FF]"
                  : "border-border hover:border-primary/30 hover:bg-[#FFF8F5]"
              }`}
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold shrink-0 text-base ${friend.isTutor ? "bg-[#EEF0FF] text-[#4A52B2]" : avatarColors[idx % avatarColors.length]}`}>
                  {friend.avatar}
                </div>
                {friend.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">{friend.unread}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-semibold text-foreground truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{friend.name}</p>
                    {friend.isTutor && (
                      <span className="shrink-0 text-xs font-semibold bg-[#EEF0FF] text-[#4A52B2] px-2 py-0.5 rounded-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Tutor
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{friend.time}</span>
                </div>
                <p className="text-muted-foreground text-sm mt-0.5 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{friend.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GroupsView({ friendNames, pendingInvites, onInvite, currentUserName }: { friendNames: Set<string>; pendingInvites: Set<string>; onInvite: (name: string) => void; currentUserName: string }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);

  useEffect(() => {
    api.listGroups().then(setGroups).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openGroup = (group: Group) => {
    setGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, unread: 0 } : g)));
    setActiveGroup({ ...group, unread: 0 });
  };

  const sendMessage = async (text: string) => {
    if (!activeGroup) return;
    try {
      const msg = await api.sendGroupMessage(activeGroup.id, text);
      const updated = { ...activeGroup, messages: [...activeGroup.messages, msg], lastMessage: `Você: ${msg.text}`, time: msg.time };
      setActiveGroup(updated);
      setGroups((prev) => prev.map((g) => (g.id === activeGroup.id ? updated : g)));
    } catch {
      /* ignore */
    }
  };

  if (activeGroup) {
    return <ChatView name={`${activeGroup.emoji} ${activeGroup.name}`} initials={activeGroup.emoji} avatarIndex={0} messages={activeGroup.messages} onBack={() => setActiveGroup(null)} onSend={sendMessage} memberList={activeGroup.memberList} friendNames={friendNames} pendingInvites={pendingInvites} onInvite={onInvite} currentUserName={currentUserName} />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-6 pb-4 shrink-0">
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Grupos</h1>
        <p className="text-muted-foreground mt-1 text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Sua comunidade ativa</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
        {loading && (
          <p className="text-muted-foreground text-sm text-center pt-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Carregando...</p>
        )}
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => openGroup(group)}
            className={`w-full rounded-2xl p-4 border flex items-start gap-4 transition-all text-left ${
              group.hasLiveEvent
                ? "bg-[#E8F5EC] border-[#4E7E57]/40 hover:border-[#4E7E57]/70"
                : "bg-card border-border hover:border-primary/30 hover:bg-[#FFF8F5]"
            }`}
          >
            <div className="relative">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${group.hasLiveEvent ? "bg-[#C6E8CF]" : "bg-muted"}`}>
                {group.emoji}
              </div>
              {group.hasLiveEvent && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#22c55e] rounded-full flex items-center justify-center border-2 border-white">
                  <Video size={10} className="text-white" />
                </span>
              )}
              {!group.hasLiveEvent && group.unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">{group.unread}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{group.name}</p>
                {group.hasLiveEvent
                  ? <span className="shrink-0 text-xs font-semibold bg-[#22c55e] text-white px-2 py-0.5 rounded-full flex items-center gap-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />Em breve</span>
                  : <span className="text-xs text-muted-foreground shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{group.time}</span>
                }
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{group.members} membros</p>
              <p className="text-sm text-muted-foreground truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{group.lastMessage}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfileView({ user, onBack, onLogout }: { user: SessionUser; onBack: () => void; onLogout: () => void }) {
  const roleLabel = user.role === "tutor" ? "Tutor" : "Idoso";
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-card border-b border-border shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.3rem" }}>Meu Perfil</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col items-center">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {user.initials}
        </div>
        <h2 className="mt-4 text-2xl font-bold text-foreground text-center" style={{ fontFamily: "'Fraunces', serif" }}>{user.name}</h2>
        <span className="mt-2 text-sm font-semibold bg-[#FFF0EB] text-primary px-3 py-1 rounded-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{roleLabel}</span>

        {/* Info card */}
        <div className="w-full mt-8 bg-card border border-border rounded-2xl divide-y divide-border" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="px-4 py-3.5">
            <p className="text-xs text-muted-foreground">Nome completo</p>
            <p className="text-base font-semibold text-foreground mt-0.5">{user.name}</p>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-xs text-muted-foreground">E-mail</p>
            <p className="text-base font-semibold text-foreground mt-0.5">{user.email}</p>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-xs text-muted-foreground">Tipo de conta</p>
            <p className="text-base font-semibold text-foreground mt-0.5">{roleLabel}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full mt-8 py-4 rounded-2xl font-semibold text-base bg-[#FBECEC] text-destructive border-2 border-destructive/20 hover:bg-[#F8E0E0] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <LogOut size={20} />
          Sair da conta
        </button>
      </div>
    </div>
  );
}

// ─── Senior App ───────────────────────────────────────────────────────────────

function SeniorApp({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const userName = user.name;
  const [tab, setTab] = useState<Tab>("exercises");
  const [showProfile, setShowProfile] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [assigned, setAssigned] = useState<AssignedActivity[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [openTutorChat, setOpenTutorChat] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<Set<string>>(new Set());
  const [friendNames, setFriendNames] = useState<Set<string>>(new Set());

  useEffect(() => { api.listExercises().then(setExercises).catch(() => {}); }, []);
  useEffect(() => { api.listAssignedActivities().then(setAssigned).catch(() => {}); }, []);
  useEffect(() => {
    api.listFriends().then((fs) => setFriendNames(new Set(fs.map((f) => f.name)))).catch(() => {});
  }, []);

  const handleInvite = (name: string) => setPendingInvites((prev) => new Set([...prev, name]));

  const toggleExercise = async (id: number) => {
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)));
    try {
      await api.toggleExercise(id);
    } catch {
      // revert on failure
      setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)));
    }
  };

  const toggleAssigned = async (id: number) => {
    setAssigned((prev) => prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a)));
    try {
      await api.toggleAssignedActivity(id);
    } catch {
      setAssigned((prev) => prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a)));
    }
  };

  const handleContactTutor = () => {
    setHelpOpen(false);
    setTab("friends");
    setOpenTutorChat(true);
  };

  // Reset the trigger after FriendsView picks it up
  const handleFriendsViewMounted = () => {
    if (openTutorChat) setOpenTutorChat(false);
  };

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "exercises", label: "Atividades", icon: <Dumbbell size={24} /> },
    { id: "friends", label: "Amigos", icon: <MessageCircle size={24} /> },
    { id: "groups", label: "Grupos", icon: <Users size={24} /> },
  ];

  if (showProfile) {
    return <ProfileView user={user} onBack={() => setShowProfile(false)} onLogout={onLogout} />;
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Help modal */}
      {helpOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setHelpOpen(false)} />
          <div className="relative bg-background rounded-3xl w-full p-6 shadow-2xl flex flex-col items-center text-center gap-5">
            <button
              onClick={() => setHelpOpen(false)}
              className="absolute top-4 left-4 w-9 h-9 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
            <div className="w-16 h-16 bg-[#EEF0FF] rounded-2xl flex items-center justify-center mt-4">
              <Shield size={32} className="text-[#4A52B2]" />
            </div>
            <div>
              <h2 className="text-foreground font-bold" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.4rem" }}>
                Dúvidas ao usar o Aplicativo?
              </h2>
              <p className="text-muted-foreground mt-2 text-base leading-relaxed">
                Um tutor pode te ajudar a qualquer momento, de forma rápida e fácil.
              </p>
            </div>
            <button
              onClick={handleContactTutor}
              className="w-full py-4 bg-[#4A52B2] text-white rounded-2xl font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} />
              Pedir ajuda a um tutor
            </button>
          </div>
        </div>
      )}

      {/* Thin top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-primary/10 border-b border-primary/10 shrink-0">
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2 rounded-full pr-2 hover:opacity-80 active:scale-95 transition-all"
        >
          <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
            <Heart size={12} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-primary" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {userName.split(" ")[0]}
          </span>
        </button>
        <button
          onClick={() => setHelpOpen(true)}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-border transition-colors font-semibold text-base"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          ?
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "exercises" && <ExercisesView exercises={exercises} onToggle={toggleExercise} userName={userName} assigned={assigned} onToggleAssigned={toggleAssigned} />}
        {tab === "friends" && (
          <FriendsView
            autoOpenTutor={openTutorChat}
            onAutoOpenHandled={handleFriendsViewMounted}
          />
        )}
        {tab === "groups" && <GroupsView friendNames={friendNames} pendingInvites={pendingInvites} onInvite={handleInvite} currentUserName={userName} />}
      </div>

      <div className="shrink-0 bg-card border-t border-border px-4 py-2 pb-3">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`relative flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all ${tab === item.id ? "text-primary bg-[#FFF0EB]" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item.id === "groups" && (
                <span className="absolute -top-1 right-2 w-5 h-5 bg-[#22c55e] rounded-full flex items-center justify-center border-2 border-card">
                  <Video size={10} className="text-white" />
                </span>
              )}
              {item.icon}
              <span className="text-xs font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [restoring, setRestoring] = useState(true);

  // Restore an existing session from a stored token on first load.
  useEffect(() => {
    if (!getToken()) { setRestoring(false); return; }
    api.me()
      .then(setSession)
      .catch(() => setToken(null))
      .finally(() => setRestoring(false));
  }, []);

  const handleLogin = (user: SessionUser) => setSession(user);
  const handleLogout = () => { setToken(null); setSession(null); };

  return (
    <div className="size-full flex items-center justify-center bg-[#E8DDD3]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div
        className="relative bg-background flex flex-col overflow-hidden shadow-2xl"
        style={{ width: "min(420px, 100vw)", height: "min(820px, 100vh)", borderRadius: "min(2rem, 0px)" }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 py-2 shrink-0 bg-background">
          <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {restoring ? null : !session ? (
          <LoginScreen onLogin={handleLogin} />
        ) : session.role === "senior" ? (
          <SeniorApp user={session} onLogout={handleLogout} />
        ) : (
          <TutorApp tutorName={session.name} onLogout={handleLogout} />
        )}
      </div>
    </div>
  );
}
