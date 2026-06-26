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
  ChevronRight,
  Check,
  AlertCircle,
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

// ─── Types ───────────────────────────────────────────────────────────────────

type TutorTab = "home" | "groups" | "avisos" | "atividades" | "eventos";

interface LiveEvent {
  id: number;
  title: string;
  activityType: string;
  scheduledAt: string;
  duration: number;
  description: string;
  status: "saved" | "sent";
  sentToGroup?: string;
  sentAt?: string;
}

interface Senior {
  id: number;
  name: string;
  initials: string;
  age: number;
  exercisesThisWeek: number;
  exercisesToday: number;
  streak: number;
  lastActive: string;
  alert?: string;
  groups: string[];
}

interface GroupMember {
  id: number;
  name: string;
  initials: string;
}

interface ChatMessage {
  id: number;
  sender: "tutor" | "member";
  senderName: string;
  text: string;
  time: string;
}

interface Group {
  id: number;
  name: string;
  emoji: string;
  description: string;
  members: GroupMember[];
  createdAt: string;
  messages: ChatMessage[];
}

interface Announcement {
  id: number;
  targetAll: boolean;
  groupId?: number;
  groupName?: string;
  text: string;
  time: string;
}

interface Activity {
  id: number;
  name: string;
  category: string;
  duration: number;
  level: "Fácil" | "Moderado";
  icon: React.ReactNode;
  completedBy: number[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const allSeniors: Senior[] = [
  { id: 1, name: "Maria Silva", initials: "MS", age: 68, exercisesThisWeek: 5, exercisesToday: 3, streak: 12, lastActive: "Hoje, 09:23", groups: ["Turma da Manhã", "Viz. Alegre"] },
  { id: 2, name: "José Santos", initials: "JS", age: 72, exercisesThisWeek: 2, exercisesToday: 0, streak: 2, lastActive: "Ontem", alert: "Pouca atividade esta semana", groups: ["Saúde em Família", "Viz. Alegre"] },
  { id: 3, name: "Ana Oliveira", initials: "AO", age: 65, exercisesThisWeek: 6, exercisesToday: 4, streak: 21, lastActive: "Hoje, 08:40", groups: ["Turma da Manhã"] },
  { id: 4, name: "Roberto Lima", initials: "RL", age: 70, exercisesThisWeek: 4, exercisesToday: 2, streak: 7, lastActive: "Hoje, 10:15", groups: ["Saúde em Família"] },
  { id: 5, name: "Lúcia Mendes", initials: "LM", age: 66, exercisesThisWeek: 7, exercisesToday: 5, streak: 30, lastActive: "Hoje, 07:55", groups: ["Turma da Manhã"] },
  { id: 6, name: "Carlos Dias", initials: "CD", age: 74, exercisesThisWeek: 1, exercisesToday: 0, streak: 0, lastActive: "3 dias atrás", alert: "Sem atividade recente", groups: ["Viz. Alegre"] },
];

const initialGroups: Group[] = [
  {
    id: 1, name: "Turma da Manhã", emoji: "🌅", description: "Exercícios matinais em grupo",
    members: [{ id: 1, name: "Maria Silva", initials: "MS" }, { id: 3, name: "Ana Oliveira", initials: "AO" }, { id: 5, name: "Lúcia Mendes", initials: "LM" }],
    createdAt: "12 mai 2025",
    messages: [
      { id: 1, sender: "member", senderName: "Maria Silva", text: "Bom dia turma! Prontos para os exercícios? 💪", time: "08:00" },
      { id: 2, sender: "member", senderName: "Ana Oliveira", text: "Prontos! Vamos lá!", time: "08:03" },
      { id: 3, sender: "tutor", senderName: "Você", text: "Ótimo! Lembrem de começar com o alongamento do pescoço hoje 🌅", time: "08:05" },
      { id: 4, sender: "member", senderName: "Lúcia Mendes", text: "Já fiz o alongamento e a respiração profunda!", time: "08:40" },
    ],
  },
  {
    id: 2, name: "Saúde em Família", emoji: "❤️", description: "Grupo para sêniores e familiares",
    members: [{ id: 2, name: "José Santos", initials: "JS" }, { id: 4, name: "Roberto Lima", initials: "RL" }],
    createdAt: "3 jan 2025",
    messages: [
      { id: 1, sender: "tutor", senderName: "Você", text: "Olá pessoal! Como estão se sentindo hoje?", time: "09:00" },
      { id: 2, sender: "member", senderName: "Roberto Lima", text: "Bem disposto! Fiz a caminhada no lugar.", time: "09:20" },
      { id: 3, sender: "member", senderName: "José Santos", text: "Hoje tive dificuldade de começar... mas vou tentar!", time: "10:00" },
      { id: 4, sender: "tutor", senderName: "Você", text: "José, que bom que vai tentar! Comece pela respiração profunda, é mais fácil 😊", time: "10:05" },
    ],
  },
  {
    id: 3, name: "Viz. Alegre", emoji: "🏠", description: "Moradores do condomínio",
    members: [{ id: 1, name: "Maria Silva", initials: "MS" }, { id: 2, name: "José Santos", initials: "JS" }, { id: 6, name: "Carlos Dias", initials: "CD" }],
    createdAt: "5 fev 2025",
    messages: [
      { id: 1, sender: "member", senderName: "Maria Silva", text: "Alguém vai fazer a caminhada no parque hoje?", time: "07:30" },
      { id: 2, sender: "tutor", senderName: "Você", text: "Boa ideia Maria! Amanhã tem aula de yoga aqui no app também 🧘", time: "07:45" },
      { id: 3, sender: "member", senderName: "Carlos Dias", text: "Eu não tenho conseguido fazer os exercícios essa semana...", time: "08:10" },
      { id: 4, sender: "tutor", senderName: "Você", text: "Carlos, tudo bem! Comece devagar. Só 5 minutos de alongamento já ajuda muito 💙", time: "08:15" },
    ],
  },
];

const initialAnnouncements: Announcement[] = [
  { id: 1, targetAll: false, groupId: 1, groupName: "Turma da Manhã", text: "Amanhã tem sessão especial de alongamento às 8h! Não percam 🌅", time: "Hoje, 07:30" },
  { id: 2, targetAll: false, groupId: 2, groupName: "Saúde em Família", text: "Parabéns ao José pela sequência de 7 dias! 🎉", time: "Ontem, 18:00" },
  { id: 3, targetAll: true, text: "Lembrem-se: beber bastante água durante os exercícios 💧", time: "Seg, 09:00" },
];

const activities: Activity[] = [
  { id: 1, name: "Alongamento do Pescoço", category: "Alongamento", duration: 5, level: "Fácil", icon: <Heart size={18} />, completedBy: [1, 3, 5] },
  { id: 2, name: "Rotação dos Ombros", category: "Alongamento", duration: 8, level: "Fácil", icon: <RotateCcw size={18} />, completedBy: [1] },
  { id: 3, name: "Equilíbrio em Um Pé", category: "Equilíbrio", duration: 5, level: "Moderado", icon: <Footprints size={18} />, completedBy: [3, 4] },
  { id: 4, name: "Respiração Profunda", category: "Respiração", duration: 7, level: "Fácil", icon: <Wind size={18} />, completedBy: [1, 2, 3, 5] },
  { id: 5, name: "Caminhada no Lugar", category: "Cardio", duration: 15, level: "Fácil", icon: <Footprints size={18} />, completedBy: [3, 5] },
  { id: 6, name: "Flexão dos Joelhos", category: "Força", duration: 10, level: "Moderado", icon: <Dumbbell size={18} />, completedBy: [] },
  { id: 7, name: "Alongamento das Costas", category: "Alongamento", duration: 8, level: "Fácil", icon: <Heart size={18} />, completedBy: [4] },
  { id: 8, name: "Elevação dos Braços", category: "Força", duration: 10, level: "Fácil", icon: <Star size={18} />, completedBy: [1, 2] },
];

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

function PageHome({ tutorName }: { tutorName: string }) {
  const withAlerts = allSeniors.filter((s) => s.alert);
  const activeToday = allSeniors.filter((s) => s.exercisesToday > 0).length;
  const topStreak = allSeniors.reduce((a, b) => (a.streak > b.streak ? a : b));
  const totalExercisesToday = allSeniors.reduce((sum, s) => sum + s.exercisesToday, 0);

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
            <p className="text-3xl font-bold" style={{ fontFamily: "'Fraunces', serif" }}>{allSeniors.length}</p>
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
                <div key={s.id} className="bg-[#FFFBF0] border border-[#F5A623]/30 rounded-2xl p-4 flex items-center gap-3">
                  <Avatar initials={s.initials} size="sm" index={idx} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.name}</p>
                    <p className="text-sm text-[#8A6020]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.alert}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="text-xs font-bold text-[#B37A10]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.exercisesThisWeek}/7</span>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>esta semana</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top streak highlight */}
        <div className="bg-gradient-to-r from-[#4A52B2] to-[#6B74D4] rounded-2xl p-4 flex items-center gap-4 text-white">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <Flame size={24} className="text-[#F5A623]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Maior sequência 🏆</p>
            <p className="font-bold text-white mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{topStreak.name} — {topStreak.streak} dias seguidos</p>
          </div>
        </div>

        {/* All seniors */}
        <div>
          <SectionLabel>Todos os sêniores</SectionLabel>
          <div className="space-y-2">
            {allSeniors.map((s, idx) => (
              <div key={s.id} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tutor Group Chat ─────────────────────────────────────────────────────────

function TutorGroupChat({ group, onBack, onUpdateGroup }: { group: Group; onBack: () => void; onUpdateGroup: (g: Group) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(group.messages);
  const [input, setInput] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = () => {
    const t = input.trim();
    if (!t) return;
    const msg: ChatMessage = {
      id: Date.now(), sender: "tutor", senderName: "Você", text: t,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    const updated = [...messages, msg];
    setMessages(updated);
    onUpdateGroup({ ...group, messages: updated });
    setInput("");
  };

  const addMember = (s: Senior) => {
    if (group.members.find((m) => m.id === s.id)) return;
    onUpdateGroup({ ...group, members: [...group.members, { id: s.id, name: s.name, initials: s.initials }] });
  };

  const removeMember = (id: number) => {
    onUpdateGroup({ ...group, members: group.members.filter((m) => m.id !== id) });
  };

  const notIn = allSeniors.filter((s) => !group.members.find((m) => m.id === s.id));

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
                <p className="text-sm text-muted-foreground">{group.members.length} participantes</p>
              </div>
              <button onClick={() => setShowMembers(false)} className="w-9 h-9 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-5">
              {/* Current members */}
              <div>
                <SectionLabel>Membros atuais ({group.members.length})</SectionLabel>
                {group.members.length === 0 && <p className="text-muted-foreground text-sm text-center py-2">Nenhum membro ainda.</p>}
                <div className="space-y-2">
                  {group.members.map((m, idx) => (
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
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{group.members.length} membros</p>
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

// ─── Grupos ───────────────────────────────────────────────────────────────────

function PageGrupos() {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🌟");
  const [newDesc, setNewDesc] = useState("");

  const emojis = ["🌅", "❤️", "🏠", "🌟", "🏃", "💪", "🎯", "🌿", "🎉", "🧘"];

  const updateGroup = (updated: Group) => {
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setActiveGroup(updated);
  };

  const createGroup = () => {
    if (!newName.trim()) return;
    setGroups((prev) => [...prev, {
      id: Date.now(), name: newName.trim(), emoji: newEmoji,
      description: newDesc.trim(), members: [], messages: [],
      createdAt: new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }),
    }]);
    setNewName(""); setNewDesc(""); setNewEmoji("🌟"); setShowNew(false);
  };

  const deleteGroup = (id: number) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  if (activeGroup) {
    return (
      <TutorGroupChat
        group={activeGroup}
        onBack={() => setActiveGroup(null)}
        onUpdateGroup={updateGroup}
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
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [selectedGroupId, setSelectedGroupId] = useState<number | "all">(initialGroups[0].id);
  const [text, setText] = useState("");

  const send = () => {
    const t = text.trim();
    if (!t) return;
    const isAll = selectedGroupId === "all";
    const group = !isAll ? groups.find((g) => g.id === selectedGroupId) : null;
    setAnnouncements((prev) => [{
      id: Date.now(),
      targetAll: isAll,
      groupId: group?.id,
      groupName: group?.name,
      text: t,
      time: `Agora, ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    }, ...prev]);
    setText("");
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
  const [filterCat, setFilterCat] = useState("Todas");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const categories = ["Todas", "Alongamento", "Equilíbrio", "Cardio", "Força", "Respiração"];
  const filtered = filterCat === "Todas" ? activities : activities.filter((a) => a.category === filterCat);

  const totalCompletions = activities.reduce((sum, a) => sum + a.completedBy.length, 0);
  const mostPopular = [...activities].sort((a, b) => b.completedBy.length - a.completedBy.length)[0];

  if (selectedActivity) {
    const completors = allSeniors.filter((s) => selectedActivity.completedBy.includes(s.id));
    const notDone = allSeniors.filter((s) => !selectedActivity.completedBy.includes(s.id));
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <button onClick={() => setSelectedActivity(null)} className="flex items-center gap-1 text-[#4A52B2] font-semibold text-sm mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <ChevronLeft size={16} /> Atividades
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${categoryColors[selectedActivity.category] || "bg-muted text-muted-foreground"}`}>
              {selectedActivity.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>{selectedActivity.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColors[selectedActivity.category]}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{selectedActivity.category}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}><Clock size={11} /> {selectedActivity.duration} min</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Concluído hoje</p>
              <p className="text-sm font-semibold text-[#4A52B2]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{completors.length}/{allSeniors.length}</p>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-[#4A52B2] rounded-full transition-all" style={{ width: `${(completors.length / allSeniors.length) * 100}%` }} />
            </div>
          </div>

          {completors.length > 0 && (
            <div>
              <SectionLabel>✅ Já fizeram hoje ({completors.length})</SectionLabel>
              <div className="space-y-2">
                {completors.map((s, idx) => (
                  <div key={s.id} className="bg-[#EBF5ED] rounded-2xl p-3 flex items-center gap-3 border border-[#4E7E57]/20">
                    <Avatar initials={s.initials} size="sm" index={idx} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.name}</p>
                      <p className="text-xs text-[#3D6B45]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>🔥 Sequência: {s.streak} dias</p>
                    </div>
                    <Check size={16} className="text-secondary shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {notDone.length > 0 && (
            <div>
              <SectionLabel>⏳ Ainda não fizeram ({notDone.length})</SectionLabel>
              <div className="space-y-2">
                {notDone.map((s, idx) => (
                  <div key={s.id} className="bg-muted rounded-2xl p-3 flex items-center gap-3">
                    <Avatar initials={s.initials} size="sm" index={idx + 10} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.name}</p>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Último acesso: {s.lastActive}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-6 pb-4 shrink-0">
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Atividades</h1>
        <p className="text-muted-foreground text-base mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Acompanhe o progresso de cada exercício</p>
      </div>

      {/* Summary cards */}
      <div className="px-5 mb-4 grid grid-cols-2 gap-3 shrink-0">
        <div className="bg-[#EEF0FF] rounded-2xl p-3">
          <p className="text-2xl font-bold text-[#4A52B2]" style={{ fontFamily: "'Fraunces', serif" }}>{totalCompletions}</p>
          <p className="text-xs font-medium text-[#3A4299] mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>exercícios concluídos hoje</p>
        </div>
        <div className="bg-[#FFF0EB] rounded-2xl p-3">
          <p className="text-sm font-bold text-[#D95C35] leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>{mostPopular.name}</p>
          <p className="text-xs font-medium text-[#A04020] mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>mais popular hoje</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="px-5 mb-3 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${filterCat === cat ? "bg-[#4A52B2] text-white" : "bg-card text-muted-foreground border border-border"}`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2">
        {filtered.map((act) => {
          const pct = Math.round((act.completedBy.length / allSeniors.length) * 100);
          return (
            <button
              key={act.id}
              onClick={() => setSelectedActivity(act)}
              className="w-full bg-card rounded-2xl p-4 border border-border text-left hover:border-[#4A52B2]/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${categoryColors[act.category] || "bg-muted text-muted-foreground"}`}>
                  {act.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.9rem" }}>{act.name}</p>
                    <span className="text-xs font-semibold text-[#4A52B2] shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{act.completedBy.length}/{allSeniors.length}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-[#4A52B2] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <Clock size={11} />{act.duration} min · {act.level}
                    </span>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{pct}% concluíram</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

const activityTypes = ["Alongamento", "Equilíbrio", "Cardio", "Força", "Respiração", "Yoga", "Dança", "Meditação"];

const initialEvents: LiveEvent[] = [
  { id: 1, title: "Alongamento Matinal em Grupo", activityType: "Alongamento", scheduledAt: "Hoje às 09:00", duration: 20, description: "Sessão guiada de alongamento para começar o dia com energia.", status: "sent", sentToGroup: "Turma da Manhã", sentAt: "Hoje, 08:25" },
  { id: 2, title: "Respiração e Relaxamento", activityType: "Respiração", scheduledAt: "Amanhã às 10:00", duration: 15, description: "Técnicas de respiração profunda para reduzir ansiedade.", status: "saved" },
  { id: 3, title: "Equilíbrio e Postura", activityType: "Equilíbrio", scheduledAt: "Sex às 09:30", duration: 25, description: "Exercícios de equilíbrio para prevenção de quedas.", status: "saved" },
];

function PageEventos() {
  const [events, setEvents] = useState<LiveEvent[]>(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [sendTarget, setSendTarget] = useState<LiveEvent | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState(initialGroups[0].name);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState(activityTypes[0]);
  const [formDate, setFormDate] = useState("");
  const [formDuration, setFormDuration] = useState("20");
  const [formDesc, setFormDesc] = useState("");

  const resetForm = () => { setFormTitle(""); setFormType(activityTypes[0]); setFormDate(""); setFormDuration("20"); setFormDesc(""); };

  const saveEvent = () => {
    if (!formTitle.trim()) return;
    setEvents((prev) => [...prev, {
      id: Date.now(),
      title: formTitle.trim(),
      activityType: formType,
      scheduledAt: formDate || "A definir",
      duration: Number(formDuration) || 20,
      description: formDesc.trim(),
      status: "saved",
    }]);
    resetForm();
    setShowForm(false);
  };

  const sendEvent = () => {
    if (!sendTarget) return;
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setEvents((prev) => prev.map((e) =>
      e.id === sendTarget.id
        ? { ...e, status: "sent", sentToGroup: selectedGroupName, sentAt: `Agora, ${now}` }
        : e
    ));
    setSendTarget(null);
  };

  const deleteEvent = (id: number) => setEvents((prev) => prev.filter((e) => e.id !== id));

  const saved = events.filter((e) => e.status === "saved");
  const sent  = events.filter((e) => e.status === "sent");

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
                {initialGroups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroupName(g.name)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                      selectedGroupName === g.name ? "border-[#4A52B2] bg-[#EEF0FF]" : "border-border bg-card"
                    }`}
                  >
                    <span className="text-xl">{g.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.members.length} membros</p>
                    </div>
                    {selectedGroupName === g.name && <Check size={16} className="text-[#4A52B2] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={sendEvent}
              className="w-full py-4 bg-[#4A52B2] text-white rounded-2xl font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Send size={18} /> Enviar para {selectedGroupName}
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
                      onClick={() => { setSendTarget(ev); setSelectedGroupName(initialGroups[0].name); }}
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
                    onClick={() => { setSendTarget(ev); setSelectedGroupName(initialGroups[0].name); }}
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
        {tab === "home"       && <PageHome tutorName={tutorName} />}
        {tab === "groups"     && <PageGrupos />}
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
