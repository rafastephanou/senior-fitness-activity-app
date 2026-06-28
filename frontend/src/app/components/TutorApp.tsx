import { useState, useRef, useEffect } from "react";
import {
  Home,
  Users,
  Bell,
  Dumbbell,
  Shield,
  Plus,
  Trash2,
  UserPlus,
  UserMinus,
  Send,
  ChevronLeft,
  MessageCircle,
  Check,
  Clock,
  Flame,
  Star,
  Heart,
  Wind,
  Footprints,
  RotateCcw,
  Settings2,
  X,
  Video,
  CalendarClock,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
} from "lucide-react";
import { api } from "../../lib/api";
import type {
  TutorSenior,
  TutorGroup,
  TutorChatMessage,
  TutorAnnouncement,
  CreatedActivity,
  RunningActivity,
  LiveEvent,
} from "../../lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type TutorTab = "home" | "groups" | "avisos" | "atividades" | "eventos";

// Maps a logical icon name (from the API) to a lucide icon.
function ActivityIcon({ name, size = 18 }: { name: string; size?: number }) {
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

const avatarColors = [
  "bg-[#F5C5B2] text-[#8B3A20]",
  "bg-[#B8D9BD] text-[#2A5C33]",
  "bg-[#C8C0E0] text-[#3D2A72]",
  "bg-[#F9E0C0] text-[#7A4A10]",
  "bg-[#C0D8F0] text-[#1A4A72]",
  "bg-[#F0C8D8] text-[#72183A]",
];

const categoryColors: Record<string, string> = {
  Alongamento: "bg-[#FFF0EB] text-[#D95C35]",
  Equilíbrio: "bg-[#EBF5ED] text-[#3D6B45]",
  Cardio: "bg-[#FFF8EB] text-[#B37A10]",
  Força: "bg-[#EEF0FF] text-[#4A52B2]",
  Respiração: "bg-[#EBF5F8] text-[#1E7490]",
};

function Avatar({ initials, size = "md", index = 0 }: { initials: string; size?: "sm" | "md" | "lg"; index?: number }) {
  const sz = size === "sm" ? "w-9 h-9 text-sm" : size === "lg" ? "w-14 h-14 text-xl" : "w-11 h-11 text-base";
  return (
    <div className={`${sz} ${avatarColors[index % avatarColors.length]} rounded-full flex items-center justify-center font-semibold shrink-0`}>
      {initials}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {children}
    </p>
  );
}

// ─── Início ───────────────────────────────────────────────────────────────────

function PageHome({ tutorName, seniors }: { tutorName: string; seniors: TutorSenior[] }) {
  const [activeSenior, setActiveSenior] = useState<TutorSenior | null>(null);

  if (activeSenior) {
    return (
      <TutorSeniorChat
        senior={activeSenior}
        index={Math.max(0, seniors.findIndex((s) => s.id === activeSenior.id))}
        onBack={() => setActiveSenior(null)}
      />
    );
  }

  const withAlerts = seniors.filter((s) => s.alert);
  const activeToday = seniors.filter((s) => s.exercisesToday > 0).length;
  const topStreak = seniors.length ? seniors.reduce((a, b) => (a.streak > b.streak ? a : b)) : null;
  const totalExercisesToday = seniors.reduce((sum, s) => sum + s.exercisesToday, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-6 pb-5 shrink-0">
        <p className="text-muted-foreground text-sm font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-3xl font-bold text-foreground mt-0.5" style={{ fontFamily: "'Fraunces', serif" }}>
          Olá, {tutorName.split(" ")[0]} 👋
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#4A52B2] rounded-2xl p-4 text-white">
            <p className="text-3xl font-bold" style={{ fontFamily: "'Fraunces', serif" }}>{seniors.length}</p>
            <p className="text-sm font-medium text-white/80 mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>sêniores sob cuidado</p>
          </div>
          <div className="bg-[#EBF5ED] rounded-2xl p-4">
            <p className="text-3xl font-bold text-[#2A5C33]" style={{ fontFamily: "'Fraunces', serif" }}>{activeToday}</p>
            <p className="text-sm font-medium text-[#3D6B45] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ativos hoje</p>
          </div>
          <div className="bg-[#FFF0EB] rounded-2xl p-4">
            <p className="text-3xl font-bold text-[#D95C35]" style={{ fontFamily: "'Fraunces', serif" }}>{totalExercisesToday}</p>
            <p className="text-sm font-medium text-[#A04020] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>exercícios feitos hoje</p>
          </div>
          <div className={`rounded-2xl p-4 ${withAlerts.length > 0 ? "bg-[#FFF5EB]" : "bg-muted"}`}>
            <p className={`text-3xl font-bold ${withAlerts.length > 0 ? "text-[#B37A10]" : "text-muted-foreground"}`} style={{ fontFamily: "'Fraunces', serif" }}>{withAlerts.length}</p>
            <p className={`text-sm font-medium mt-1 ${withAlerts.length > 0 ? "text-[#8A5A10]" : "text-muted-foreground"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>precisam de atenção</p>
          </div>
        </div>

        {/* Alerts */}
        {withAlerts.length > 0 && (
          <div>
            <SectionLabel>⚠️ Requerem atenção</SectionLabel>
            <div className="space-y-2">
              {withAlerts.map((s, idx) => (
                <button key={s.id} onClick={() => setActiveSenior(s)} className="w-full text-left bg-[#FFFBF0] border border-[#F5A623]/30 rounded-2xl p-4 flex items-center gap-3 hover:border-[#F5A623]/60 active:scale-[0.99] transition-all">
                  <Avatar initials={s.initials} size="sm" index={idx} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.name}</p>
                    <p className="text-sm text-[#8A6020]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.alert}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="text-xs font-bold text-[#B37A10]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.exercisesThisWeek}/7</span>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>esta semana</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Top streak highlight */}
        {topStreak && (
          <div className="bg-gradient-to-r from-[#4A52B2] to-[#6B74D4] rounded-2xl p-4 flex items-center gap-4 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Flame size={24} className="text-[#F5A623]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Maior sequência 🏆</p>
              <p className="font-bold text-white mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{topStreak.name} — {topStreak.streak} dias seguidos</p>
            </div>
          </div>
        )}

        {/* All seniors */}
        <div>
          <SectionLabel>Todos os sêniores</SectionLabel>
          <div className="space-y-2">
            {seniors.map((s, idx) => (
              <button key={s.id} onClick={() => setActiveSenior(s)} className="w-full text-left bg-card rounded-2xl p-4 border border-border flex items-center gap-3 hover:border-[#4A52B2]/40 hover:bg-[#FAFAFE] active:scale-[0.99] transition-all">
                <Avatar initials={s.initials} size="sm" index={idx} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.name}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${s.exercisesThisWeek >= 5 ? "bg-[#EBF5ED] text-[#3D6B45]" : s.exercisesThisWeek >= 3 ? "bg-[#FFF0EB] text-[#D95C35]" : "bg-[#FFF5EB] text-[#B37A10]"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {s.exercisesThisWeek} esta semana
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {s.age} anos · {s.lastActive} · 🔥 {s.streak} dias
                  </p>
                </div>
                <MessageCircle size={18} className="text-[#4A52B2] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tutor Group Chat ─────────────────────────────────────────────────────────

function TutorGroupChat({ group, seniors, onBack, onUpdated }: { group: TutorGroup; seniors: TutorSenior[]; onBack: () => void; onUpdated: (g: TutorGroup) => void }) {
  const [messages, setMessages] = useState<TutorChatMessage[]>(group.messages);
  const [members, setMembers] = useState(group.members);
  const [input, setInput] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    const t = input.trim();
    if (!t) return;
    setInput("");
    try {
      const msg = await api.sendTutorGroupMessage(group.id, t);
      setMessages((prev) => [...prev, msg]);
    } catch {
      /* ignore */
    }
  };

  const addMember = async (s: TutorSenior) => {
    if (members.find((m) => m.id === s.id)) return;
    try {
      const g = await api.addGroupMember(group.id, s.id);
      setMembers(g.members);
      onUpdated(g);
    } catch {
      /* ignore */
    }
  };

  const removeMember = async (id: number) => {
    try {
      const g = await api.removeGroupMember(group.id, id);
      setMembers(g.members);
      onUpdated(g);
    } catch {
      /* ignore */
    }
  };

  const notIn = seniors.filter((s) => !members.find((m) => m.id === s.id));

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Members panel modal */}
      {showMembers && (
        <div className="absolute inset-0 z-50 flex items-end" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMembers(false)} />
          <div className="relative bg-background rounded-t-3xl w-full shadow-2xl max-h-[80%] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem" }}>Membros do grupo</h2>
                <p className="text-sm text-muted-foreground">{members.length} participantes</p>
              </div>
              <button onClick={() => setShowMembers(false)} className="w-9 h-9 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-5">
              {/* Current members */}
              <div>
                <SectionLabel>Membros atuais ({members.length})</SectionLabel>
                {members.length === 0 && <p className="text-muted-foreground text-sm text-center py-2">Nenhum membro ainda.</p>}
                <div className="space-y-2">
                  {members.map((m, idx) => (
                    <div key={m.id} className="bg-muted rounded-2xl p-3 flex items-center gap-3">
                      <Avatar initials={m.initials} size="sm" index={idx} />
                      <span className="flex-1 font-medium text-foreground">{m.name}</span>
                      <button onClick={() => removeMember(m.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#FFF0EB] text-destructive hover:bg-destructive hover:text-white transition-colors">
                        <UserMinus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Add members */}
              {notIn.length > 0 && (
                <div>
                  <SectionLabel>Adicionar sêniores</SectionLabel>
                  <div className="space-y-2">
                    {notIn.map((s, idx) => (
                      <div key={s.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
                        <Avatar initials={s.initials} size="sm" index={idx + 6} />
                        <span className="flex-1 font-medium text-foreground">{s.name}</span>
                        <button onClick={() => addMember(s)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#EBF5ED] text-secondary hover:bg-secondary hover:text-white transition-colors">
                          <UserPlus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-foreground shrink-0">
          <ChevronLeft size={24} />
        </button>
        <div className="w-10 h-10 bg-[#EEF0FF] rounded-2xl flex items-center justify-center text-xl shrink-0">{group.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{group.name}</p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{members.length} membros</p>
        </div>
        <button
          onClick={() => setShowMembers(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#EEF0FF] text-[#4A52B2] hover:bg-[#4A52B2] hover:text-white transition-colors shrink-0"
        >
          <Settings2 size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "tutor" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[78%] px-4 py-3 rounded-2xl text-base leading-relaxed ${
                msg.sender === "tutor"
                  ? "bg-[#4A52B2] text-white rounded-tr-sm"
                  : "bg-card text-card-foreground border border-border rounded-tl-sm"
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {msg.sender === "member" && (
                <p className="text-xs font-semibold text-[#4A52B2] mb-1">{msg.senderName}</p>
              )}
              <p>{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.sender === "tutor" ? "text-white/60" : "text-muted-foreground"}`}>{msg.time}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-card border-t border-border shrink-0">
        <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Escreva uma mensagem..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-9 h-9 bg-[#4A52B2] text-white rounded-full flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tutor ↔ Senior direct chat ───────────────────────────────────────────────

function TutorSeniorChat({ senior, index, onBack }: { senior: TutorSenior; index: number; onBack: () => void }) {
  const [messages, setMessages] = useState<TutorChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.listSeniorMessages(senior.id)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [senior.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    const t = input.trim();
    if (!t) return;
    setInput("");
    try {
      const msg = await api.sendSeniorMessage(senior.id, t);
      setMessages((prev) => [...prev, msg]);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-foreground shrink-0">
          <ChevronLeft size={24} />
        </button>
        <Avatar initials={senior.initials} size="sm" index={index} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{senior.name}</p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{senior.age} anos · {senior.lastActive}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background">
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Nenhuma mensagem ainda. Diga olá para {senior.name.split(" ")[0]}! 👋
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "tutor" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[78%] px-4 py-3 rounded-2xl text-base leading-relaxed ${
                msg.sender === "tutor"
                  ? "bg-[#4A52B2] text-white rounded-tr-sm"
                  : "bg-card text-card-foreground border border-border rounded-tl-sm"
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <p>{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.sender === "tutor" ? "text-white/60" : "text-muted-foreground"}`}>{msg.time}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-card border-t border-border shrink-0">
        <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Escreva uma mensagem..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-9 h-9 bg-[#4A52B2] text-white rounded-full flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Grupos ───────────────────────────────────────────────────────────────────

function PageGrupos({ seniors }: { seniors: TutorSenior[] }) {
  const [groups, setGroups] = useState<TutorGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<TutorGroup | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🌟");
  const [newDesc, setNewDesc] = useState("");

  const emojis = ["🌅", "❤️", "🏠", "🌟", "🏃", "💪", "🎯", "🌿", "🎉", "🧘"];

  useEffect(() => {
    api.listTutorGroups().then(setGroups).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const onUpdated = (updated: TutorGroup) => {
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setActiveGroup(updated);
  };

  const createGroup = async () => {
    if (!newName.trim()) return;
    try {
      const g = await api.createTutorGroup({ name: newName.trim(), emoji: newEmoji, description: newDesc.trim() });
      setGroups((prev) => [...prev, g]);
      setNewName(""); setNewDesc(""); setNewEmoji("🌟"); setShowNew(false);
    } catch {
      /* ignore */
    }
  };

  const deleteGroup = async (id: number) => {
    try {
      await api.deleteTutorGroup(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch {
      /* ignore */
    }
  };

  if (activeGroup) {
    return (
      <TutorGroupChat
        group={activeGroup}
        seniors={seniors}
        onBack={() => setActiveGroup(null)}
        onUpdated={onUpdated}
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Grupos</h1>
            <p className="text-muted-foreground text-base mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{groups.length} grupos ativos</p>
          </div>
          <button onClick={() => setShowNew(true)} className="w-11 h-11 bg-[#4A52B2] text-white rounded-full flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity">
            <Plus size={22} />
          </button>
        </div>
      </div>

      {showNew && (
        <div className="mx-5 mb-4 bg-[#EEF0FF] rounded-2xl p-4 border border-[#4A52B2]/20 shrink-0">
          <p className="font-semibold text-[#4A52B2] mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Novo grupo</p>
          <div className="flex gap-2 mb-3 flex-wrap">
            {emojis.map((e) => (
              <button key={e} onClick={() => setNewEmoji(e)} className={`text-xl w-9 h-9 rounded-xl transition-all ${newEmoji === e ? "bg-[#4A52B2] shadow-sm" : "bg-white"}`}>{e}</button>
            ))}
          </div>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do grupo" className="w-full bg-white rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none border border-border text-sm mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descrição (opcional)" className="w-full bg-white rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none border border-border text-sm mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
          <div className="flex gap-2">
            <button onClick={() => setShowNew(false)} className="flex-1 py-2 rounded-xl border border-border bg-white text-muted-foreground text-sm font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cancelar</button>
            <button onClick={createGroup} disabled={!newName.trim()} className="flex-1 py-2 rounded-xl bg-[#4A52B2] text-white text-sm font-semibold disabled:opacity-40" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Criar</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
        {loading && <p className="text-muted-foreground text-sm text-center pt-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Carregando...</p>}
        {groups.map((g) => {
          const lastMsg = g.messages[g.messages.length - 1];
          return (
            <div
              key={g.id}
              onClick={() => setActiveGroup(g)}
              className="w-full bg-card rounded-2xl p-4 border border-border text-left hover:border-[#4A52B2]/30 hover:bg-[#F7F8FF] transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl w-12 h-12 flex items-center justify-center shrink-0 bg-[#EEF0FF] rounded-2xl">{g.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{g.name}</p>
                    {lastMsg && <span className="text-xs text-muted-foreground shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{lastMsg.time}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{g.members.length} membro{g.members.length !== 1 ? "s" : ""}</p>
                  {lastMsg && (
                    <p className="text-sm text-muted-foreground mt-1 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <span className="font-medium">{lastMsg.senderName}:</span> {lastMsg.text}
                    </p>
                  )}
                  <div className="flex -space-x-2 mt-2">
                    {g.members.slice(0, 5).map((m, idx) => (
                      <div key={m.id} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${avatarColors[idx % avatarColors.length]}`}>{m.initials[0]}</div>
                    ))}
                    {g.members.length > 5 && <div className="w-6 h-6 rounded-full border-2 border-white bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">+{g.members.length - 5}</div>}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteGroup(g.id); }}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#FFF0EB] text-muted-foreground hover:bg-destructive hover:text-white transition-colors shrink-0 self-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Avisos ───────────────────────────────────────────────────────────────────

function PageAvisos() {
  const [announcements, setAnnouncements] = useState<TutorAnnouncement[]>([]);
  const [groups, setGroups] = useState<TutorGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | "all">("all");
  const [text, setText] = useState("");

  useEffect(() => {
    Promise.all([api.listAnnouncements(), api.listTutorGroups()])
      .then(([a, g]) => { setAnnouncements(a); setGroups(g); })
      .catch(() => {});
  }, []);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    try {
      const ann = await api.createAnnouncement(t, selectedGroupId === "all" ? null : selectedGroupId);
      setAnnouncements((prev) => [ann, ...prev]);
      setText("");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-6 pb-4 shrink-0">
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Avisos</h1>
        <p className="text-muted-foreground text-base mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Envie comunicados para seus grupos</p>
      </div>

      {/* Compose box */}
      <div className="mx-5 mb-4 bg-[#EEF0FF] rounded-2xl p-4 border border-[#4A52B2]/20 shrink-0">
        <p className="text-sm font-semibold text-[#4A52B2] mb-3 flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Bell size={14} /> Novo aviso
        </p>
        {/* Target selector */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedGroupId("all")}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${selectedGroupId === "all" ? "bg-[#4A52B2] text-white" : "bg-white text-muted-foreground border border-border"}`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            📣 Todos
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGroupId(g.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${selectedGroupId === g.id ? "bg-[#4A52B2] text-white" : "bg-white text-muted-foreground border border-border"}`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {g.emoji} {g.name}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva um aviso para o grupo..."
            rows={3}
            className="flex-1 bg-white rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none border border-border text-sm resize-none"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          />
          <button onClick={send} disabled={!text.trim()} className="w-10 h-10 bg-[#4A52B2] text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0">
            <Send size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <SectionLabel>Histórico de avisos</SectionLabel>
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-start justify-between gap-2 mb-2">
                {ann.targetAll
                  ? <span className="text-xs font-semibold bg-[#4A52B2] text-white px-2.5 py-0.5 rounded-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📣 Todos os grupos</span>
                  : <span className="text-xs font-semibold bg-[#EEF0FF] text-[#4A52B2] px-2.5 py-0.5 rounded-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {groups.find((g) => g.id === ann.groupId)?.emoji} {ann.groupName}
                    </span>
                }
                <span className="text-xs text-muted-foreground shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ann.time}</span>
              </div>
              <p className="text-foreground text-sm leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ann.text}</p>
              <p className="text-xs text-secondary flex items-center gap-1 mt-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <Check size={11} /> Enviado
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Atividades ───────────────────────────────────────────────────────────────

function PageAtividades() {
  const [created, setCreated] = useState<CreatedActivity[]>([]);
  const [running, setRunning] = useState<RunningActivity[]>([]);
  const [groups, setGroups] = useState<TutorGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showNew, setShowNew] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCat, setFormCat] = useState("Alongamento");
  const [formDuration, setFormDuration] = useState("10");
  const [formDesc, setFormDesc] = useState("");

  // Dispatch modal
  const [dispatchTarget, setDispatchTarget] = useState<CreatedActivity | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const categories = ["Alongamento", "Equilíbrio", "Cardio", "Força", "Respiração"];

  useEffect(() => {
    Promise.all([api.listTutorActivities(), api.listRunningActivities(), api.listTutorGroups()])
      .then(([c, r, g]) => { setCreated(c); setRunning(r); setGroups(g); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => { setFormName(""); setFormCat("Alongamento"); setFormDuration("10"); setFormDesc(""); };

  const createActivity = async () => {
    if (!formName.trim()) return;
    try {
      const a = await api.createTutorActivity({ name: formName.trim(), category: formCat, duration: Number(formDuration) || 10, description: formDesc.trim() });
      setCreated((prev) => [...prev, a]);
      resetForm(); setShowNew(false);
    } catch { /* ignore */ }
  };

  const deleteActivity = async (id: number) => {
    try { await api.deleteTutorActivity(id); setCreated((prev) => prev.filter((a) => a.id !== id)); } catch { /* ignore */ }
  };

  const openDispatch = (a: CreatedActivity) => { setDispatchTarget(a); setSelectedGroupId(groups[0]?.id ?? null); };

  const doDispatch = async () => {
    if (!dispatchTarget || selectedGroupId === null) return;
    try {
      const r = await api.dispatchActivity(dispatchTarget.id, selectedGroupId);
      setRunning((prev) => [r, ...prev]);
      setDispatchTarget(null);
    } catch { /* ignore */ }
  };

  const endRunning = async (id: number) => {
    try { await api.endRunningActivity(id); setRunning((prev) => prev.filter((r) => r.id !== id)); } catch { /* ignore */ }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Dispatch modal */}
      {dispatchTarget && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setDispatchTarget(null)} />
          <div className="relative bg-background rounded-3xl w-full shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.2rem" }}>Disponibilizar atividade</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Escolha o grupo que receberá a atividade</p>
              </div>
              <button onClick={() => setDispatchTarget(null)} className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"><X size={16} /></button>
            </div>
            {/* Preview */}
            <div className="bg-[#EEF0FF] rounded-2xl p-4 border border-[#4A52B2]/20 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${categoryColors[dispatchTarget.category] || "bg-white"}`}><ActivityIcon name={dispatchTarget.icon} /></div>
              <div>
                <p className="font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>{dispatchTarget.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11} />{dispatchTarget.duration} min · {dispatchTarget.category}</p>
              </div>
            </div>
            {/* Group selector */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Disponibilizar para</p>
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum grupo disponível.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                  {groups.map((g) => (
                    <button key={g.id} onClick={() => setSelectedGroupId(g.id)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${selectedGroupId === g.id ? "border-[#4A52B2] bg-[#EEF0FF]" : "border-border bg-card"}`}>
                      <span className="text-xl">{g.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{g.members.length} membros</p>
                      </div>
                      {selectedGroupId === g.id && <Check size={16} className="text-[#4A52B2] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={doDispatch} disabled={selectedGroupId === null} className="w-full py-4 bg-[#4A52B2] text-white rounded-2xl font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40">
              <Send size={18} /> Disponibilizar para {selectedGroup?.name ?? "grupo"}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Atividades</h1>
            <p className="text-muted-foreground text-base mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Crie e disponibilize atividades</p>
          </div>
          <button onClick={() => setShowNew((v) => !v)} className="w-11 h-11 bg-[#4A52B2] text-white rounded-full flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity">
            {showNew ? <X size={20} /> : <Plus size={22} />}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showNew && (
        <div className="mx-5 mb-4 bg-[#EEF0FF] rounded-2xl p-4 border border-[#4A52B2]/20 shrink-0 space-y-3">
          <p className="font-semibold text-[#4A52B2] flex items-center gap-2"><Dumbbell size={15} /> Nova atividade</p>
          <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome da atividade" className="w-full bg-white rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground outline-none border border-border text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <select value={formCat} onChange={(e) => setFormCat(e.target.value)} className="w-full appearance-none bg-white rounded-xl px-3 py-2.5 text-foreground outline-none border border-border text-sm pr-8">
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            <input value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="Duração (min)" type="number" min={1} className="bg-white rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground outline-none border border-border text-sm" />
          </div>
          <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Descrição (opcional)" rows={2} className="w-full bg-white rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground outline-none border border-border text-sm resize-none" />
          <div className="flex gap-2">
            <button onClick={() => { resetForm(); setShowNew(false); }} className="flex-1 py-2.5 rounded-xl border border-border bg-white text-muted-foreground text-sm font-medium">Cancelar</button>
            <button onClick={createActivity} disabled={!formName.trim()} className="flex-1 py-2.5 rounded-xl bg-[#4A52B2] text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5"><Plus size={14} /> Criar atividade</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-6">
        {loading && <p className="text-muted-foreground text-sm text-center pt-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Carregando...</p>}

        {/* Em execução */}
        {running.length > 0 && (
          <div>
            <SectionLabel>▶️ Em execução ({running.length})</SectionLabel>
            <div className="space-y-3">
              {running.map((r) => {
                const pct = r.totalMembers ? Math.round((r.completedCount / r.totalMembers) * 100) : 0;
                return (
                  <div key={r.id} className="bg-[#F7F8FF] rounded-2xl border border-[#4A52B2]/25 p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${categoryColors[r.category] || "bg-muted text-muted-foreground"}`}><ActivityIcon name={r.icon} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{r.name}</p>
                          <span className="text-xs text-muted-foreground shrink-0">{r.startedLabel}</span>
                        </div>
                        <p className="text-xs text-[#4A52B2] font-medium mt-0.5">Grupo: {r.groupName}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">Concluíram</span>
                        <span className="text-xs font-semibold text-[#4A52B2]">{r.completedCount}/{r.totalMembers}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#4A52B2] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      {r.completors.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1.5">✅ {r.completors.map((n) => n.split(" ")[0]).join(", ")}</p>
                      )}
                    </div>
                    <button onClick={() => endRunning(r.id)} className="mt-3 w-full py-2 border border-destructive/30 text-destructive rounded-xl font-semibold text-sm hover:bg-[#FBECEC] transition-colors flex items-center justify-center gap-2">
                      <X size={14} /> Encerrar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Criadas */}
        <div>
          <SectionLabel>Atividades criadas ({created.length})</SectionLabel>
          <div className="space-y-2">
            {created.map((a) => (
              <div key={a.id} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${categoryColors[a.category] || "bg-muted text-muted-foreground"}`}><ActivityIcon name={a.icon} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.9rem" }}>{a.name}</p>
                      {a.isCustom && <span className="shrink-0 text-[10px] font-semibold bg-[#EEF0FF] text-[#4A52B2] px-1.5 py-0.5 rounded-full">Personalizada</span>}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock size={11} />{a.duration} min · {a.category}</span>
                  </div>
                  {a.isCustom && (
                    <button onClick={() => deleteActivity(a.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#FFF0EB] text-muted-foreground hover:bg-destructive hover:text-white transition-colors shrink-0"><Trash2 size={14} /></button>
                  )}
                </div>
                <button onClick={() => openDispatch(a)} className="mt-3 w-full py-2.5 bg-[#4A52B2] text-white rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <Send size={14} /> Disponibilizar para grupo
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

const activityTypes = ["Alongamento", "Equilíbrio", "Cardio", "Força", "Respiração", "Yoga", "Dança", "Meditação"];

function PageEventos() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [groups, setGroups] = useState<TutorGroup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [sendTarget, setSendTarget] = useState<LiveEvent | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState(activityTypes[0]);
  const [formDate, setFormDate] = useState("");
  const [formDuration, setFormDuration] = useState("20");
  const [formDesc, setFormDesc] = useState("");

  useEffect(() => {
    Promise.all([api.listEvents(), api.listTutorGroups()])
      .then(([e, g]) => { setEvents(e); setGroups(g); })
      .catch(() => {});
  }, []);

  const resetForm = () => { setFormTitle(""); setFormType(activityTypes[0]); setFormDate(""); setFormDuration("20"); setFormDesc(""); };

  const saveEvent = async () => {
    if (!formTitle.trim()) return;
    try {
      const ev = await api.createEvent({
        title: formTitle.trim(),
        activityType: formType,
        scheduledAt: formDate || "A definir",
        duration: Number(formDuration) || 20,
        description: formDesc.trim(),
      });
      setEvents((prev) => [...prev, ev]);
      resetForm();
      setShowForm(false);
    } catch {
      /* ignore */
    }
  };

  const openSend = (ev: LiveEvent) => {
    setSendTarget(ev);
    setSelectedGroupId(groups[0]?.id ?? null);
  };

  const sendEvent = async () => {
    if (!sendTarget || selectedGroupId === null) return;
    try {
      const updated = await api.sendEvent(sendTarget.id, selectedGroupId);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setSendTarget(null);
    } catch {
      /* ignore */
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      await api.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      /* ignore */
    }
  };

  const saved = events.filter((e) => e.status === "saved");
  const sent = events.filter((e) => e.status === "sent");
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Send-to-group modal */}
      {sendTarget && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSendTarget(null)} />
          <div className="relative bg-background rounded-3xl w-full shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.2rem" }}>Enviar evento</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Escolha o grupo que receberá o evento ao vivo</p>
              </div>
              <button onClick={() => setSendTarget(null)} className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
                <X size={16} />
              </button>
            </div>

            {/* Event preview */}
            <div className="bg-[#EEF0FF] rounded-2xl p-4 border border-[#4A52B2]/20">
              <div className="flex items-center gap-2 mb-1">
                <Video size={14} className="text-[#4A52B2]" />
                <span className="text-xs font-semibold text-[#4A52B2] uppercase tracking-wide">Evento ao vivo</span>
              </div>
              <p className="font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>{sendTarget.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarClock size={11} />{sendTarget.scheduledAt}</span>
                <span className="flex items-center gap-1"><Clock size={11} />{sendTarget.duration} min</span>
              </div>
            </div>

            {/* Group selector */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Enviar para</p>
              <div className="flex flex-col gap-2">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                      selectedGroupId === g.id ? "border-[#4A52B2] bg-[#EEF0FF]" : "border-border bg-card"
                    }`}
                  >
                    <span className="text-xl">{g.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.members.length} membros</p>
                    </div>
                    {selectedGroupId === g.id && <Check size={16} className="text-[#4A52B2] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={sendEvent}
              disabled={selectedGroupId === null}
              className="w-full py-4 bg-[#4A52B2] text-white rounded-2xl font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Send size={18} /> Enviar para {selectedGroup?.name ?? "grupo"}
            </button>
          </div>
        </div>
      )}

      <div className="px-5 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Eventos</h1>
            <p className="text-muted-foreground text-base mt-1">Crie e envie eventos ao vivo</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="w-11 h-11 bg-[#4A52B2] text-white rounded-full flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity"
          >
            {showForm ? <X size={20} /> : <Plus size={22} />}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mx-5 mb-4 bg-[#EEF0FF] rounded-2xl p-4 border border-[#4A52B2]/20 shrink-0 space-y-3">
          <p className="font-semibold text-[#4A52B2] flex items-center gap-2"><Video size={15} /> Novo evento ao vivo</p>

          <input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Nome do evento"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground outline-none border border-border text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full appearance-none bg-white rounded-xl px-3 py-2.5 text-foreground outline-none border border-border text-sm pr-8"
              >
                {activityTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            <input
              value={formDuration}
              onChange={(e) => setFormDuration(e.target.value)}
              placeholder="Duração (min)"
              type="number"
              min={5}
              className="bg-white rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground outline-none border border-border text-sm"
            />
          </div>

          <input
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            placeholder="Horário (ex: Hoje às 09:00)"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground outline-none border border-border text-sm"
          />

          <textarea
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="Descrição do evento (opcional)"
            rows={2}
            className="w-full bg-white rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground outline-none border border-border text-sm resize-none"
          />

          <div className="flex gap-2">
            <button onClick={() => { resetForm(); setShowForm(false); }} className="flex-1 py-2.5 rounded-xl border border-border bg-white text-muted-foreground text-sm font-medium">
              Cancelar
            </button>
            <button
              onClick={saveEvent}
              disabled={!formTitle.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#4A52B2] text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <Bookmark size={14} /> Salvar evento
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">
        {/* Saved events */}
        {saved.length > 0 && (
          <div>
            <SectionLabel>Salvos ({saved.length})</SectionLabel>
            <div className="space-y-3">
              {saved.map((ev) => (
                <div key={ev.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        { Alongamento: "bg-[#FFF0EB] text-[#D95C35]", Equilíbrio: "bg-[#EBF5ED] text-[#3D6B45]", Cardio: "bg-[#FFF8EB] text-[#B37A10]", Força: "bg-[#EEF0FF] text-[#4A52B2]", Respiração: "bg-[#EBF5F8] text-[#1E7490]", Yoga: "bg-[#F5EBF8] text-[#7A1E90]", Dança: "bg-[#FFF0F5] text-[#B2204A]", Meditação: "bg-[#EBF5F8] text-[#1E7490]" }[ev.activityType] || "bg-muted text-muted-foreground"
                      }`}>
                        {ev.activityType}
                      </span>
                      <button onClick={() => deleteEvent(ev.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <h3 className="font-bold text-foreground leading-tight" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.05rem" }}>{ev.title}</h3>
                    {ev.description && <p className="text-sm text-muted-foreground mt-1 leading-snug">{ev.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarClock size={11} />{ev.scheduledAt}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{ev.duration} min</span>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => openSend(ev)}
                      className="w-full py-2.5 bg-[#4A52B2] text-white rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={14} /> Enviar para grupo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent events */}
        {sent.length > 0 && (
          <div>
            <SectionLabel>Enviados ({sent.length})</SectionLabel>
            <div className="space-y-3">
              {sent.map((ev) => (
                <div key={ev.id} className="bg-[#F4FAF5] rounded-2xl border border-[#4E7E57]/20 px-4 py-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <BookmarkCheck size={14} className="text-secondary shrink-0" />
                      <span className="text-xs font-semibold text-secondary">Enviado para {ev.sentToGroup}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{ev.sentAt}</span>
                  </div>
                  <h3 className="font-bold text-foreground leading-tight" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.05rem" }}>{ev.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarClock size={11} />{ev.scheduledAt}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{ev.duration} min</span>
                  </div>
                  <button
                    onClick={() => openSend(ev)}
                    className="mt-3 w-full py-2 border border-[#4A52B2]/30 text-[#4A52B2] rounded-xl font-semibold text-sm hover:bg-[#EEF0FF] transition-colors flex items-center justify-center gap-2"
                  >
                    <Send size={13} /> Enviar para outro grupo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {saved.length === 0 && sent.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-16 h-16 bg-[#EEF0FF] rounded-2xl flex items-center justify-center">
              <Video size={28} className="text-[#4A52B2]" />
            </div>
            <p className="font-semibold text-foreground" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.1rem" }}>Nenhum evento ainda</p>
            <p className="text-muted-foreground text-sm max-w-[220px]">Crie seu primeiro evento ao vivo e envie para um grupo.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TutorApp({ tutorName }: { tutorName: string; onLogout?: () => void }) {
  const [tab, setTab] = useState<TutorTab>("home");
  const [seniors, setSeniors] = useState<TutorSenior[]>([]);

  useEffect(() => {
    api.listSeniors().then(setSeniors).catch(() => {});
  }, []);

  const navItems: { id: TutorTab; label: string; icon: React.ReactNode }[] = [
    { id: "home",      label: "Início",     icon: <Home size={20} /> },
    { id: "groups",    label: "Grupos",     icon: <Users size={20} /> },
    { id: "avisos",    label: "Avisos",     icon: <Bell size={20} /> },
    { id: "atividades",label: "Atividades", icon: <Dumbbell size={20} /> },
    { id: "eventos",   label: "Eventos",    icon: <Video size={20} /> },
  ];

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#4A52B2] text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Painel do Tutor
          </span>
        </div>
        <button
          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors font-semibold text-base"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          ?
        </button>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        {tab === "home"       && <PageHome tutorName={tutorName} seniors={seniors} />}
        {tab === "groups"     && <PageGrupos seniors={seniors} />}
        {tab === "avisos"     && <PageAvisos />}
        {tab === "atividades" && <PageAtividades />}
        {tab === "eventos"    && <PageEventos />}
      </div>

      {/* Bottom nav */}
      <div className="shrink-0 bg-card border-t border-border px-2 py-2 pb-3">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-2xl transition-all ${
                tab === item.id ? "text-[#4A52B2] bg-[#EEF0FF]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              <span className="text-xs font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
