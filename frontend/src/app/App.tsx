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
  Plus,
  Search,
  LogOut,
  Video,
  CalendarClock,
  X,
  Play,
  UserPlus,
} from "lucide-react";
import { LoginScreen } from "./components/LoginScreen";
import { TutorApp } from "./components/TutorApp";

// ─── Types ──────────────────────────────────────────────────────────────────

type Role = "senior" | "tutor";
type Tab = "exercises" | "friends" | "groups";

interface Usuario {
  id: number;
  name: string;
  initials: string;
  isTutor?: boolean;
}

interface Exercise {
  id: number;
  name: string;
  category: string;
  duration: number;
  level: "Fácil" | "Moderado";
  icon: React.ReactNode;
  benefit: string;
  steps: string[];
  tip: string;
}

interface EventCard {
  title: string;
  activityType: string;
  participants: number;
  scheduledAt: string;
  host: string;
}

interface Message {
  id: number;
  sender: "me" | "them";
  text: string;
  time: string;
  senderName?: string;
  isTutor?: boolean;
  event?: EventCard;
}

interface Friend {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isTutor?: boolean;
  messages: Message[];
}

type GroupMemberEntry = Pick<Usuario, "name" | "initials" | "isTutor">;

interface Group {
  id: number;
  name: string;
  emoji: string;
  members: number;
  memberList: GroupMemberEntry[];
  lastMessage: string;
  time: string;
  unread: number;
  hasLiveEvent?: boolean;
  messages: Message[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const exercises: Exercise[] = [
  { id: 1, name: "Alongamento do Pescoço", category: "Alongamento", duration: 5, level: "Fácil", icon: <Heart size={22} />, benefit: "Alivia tensão e melhora mobilidade",
    steps: ["Sente-se em uma cadeira com as costas eretas e os pés no chão.", "Incline lentamente a cabeça para a direita, levando a orelha em direção ao ombro. Segure por 10 segundos.", "Volte ao centro e repita para o lado esquerdo. Segure por 10 segundos.", "Gire suavemente a cabeça para a direita, olhando por cima do ombro. Segure por 10 segundos.", "Repita para o lado esquerdo. Faça 3 repetições de cada lado."],
    tip: "Não force o pescoço. O movimento deve ser suave e sem dor." },
  { id: 2, name: "Rotação dos Ombros", category: "Alongamento", duration: 8, level: "Fácil", icon: <RotateCcw size={22} />, benefit: "Solta os músculos e melhora postura",
    steps: ["Sente-se ou fique em pé com os braços relaxados ao lado do corpo.", "Eleve os ombros em direção às orelhas e role-os para trás em um círculo largo.", "Faça 10 rotações para trás, devagar e com controle.", "Inverta a direção e faça 10 rotações para a frente.", "Ao final, sacuda os braços suavemente para relaxar."],
    tip: "Mantenha a respiração constante durante todo o exercício." },
  { id: 3, name: "Equilíbrio em Um Pé", category: "Equilíbrio", duration: 5, level: "Moderado", icon: <Footprints size={22} />, benefit: "Previne quedas e fortalece tornozelos",
    steps: ["Fique em pé perto de uma parede ou cadeira para apoio de segurança.", "Com as mãos levemente apoiadas, levante o pé direito do chão, dobrando o joelho.", "Mantenha o equilíbrio por 10 a 30 segundos, olhando para um ponto fixo à frente.", "Abaixe o pé com cuidado e repita com o pé esquerdo.", "Faça 3 repetições para cada pé, aumentando o tempo gradualmente."],
    tip: "Sempre tenha uma superfície de apoio por perto. Nunca feche os olhos durante este exercício." },
  { id: 4, name: "Respiração Profunda", category: "Respiração", duration: 7, level: "Fácil", icon: <Wind size={22} />, benefit: "Reduz ansiedade e melhora oxigenação",
    steps: ["Sente-se confortavelmente, com as costas eretas e as mãos sobre o colo.", "Feche os olhos e inspire lentamente pelo nariz contando até 4.", "Segure o ar por 2 segundos.", "Expire lentamente pela boca contando até 6, soltando todo o ar.", "Repita esse ciclo por 7 minutos, mantendo o ritmo tranquilo."],
    tip: "Tente fazer este exercício pela manhã para começar o dia com calma." },
  { id: 5, name: "Caminhada no Lugar", category: "Cardio", duration: 15, level: "Fácil", icon: <Footprints size={22} />, benefit: "Aquece o corpo e ativa a circulação",
    steps: ["Fique em pé com os pés afastados na largura dos quadris, próximo a uma parede para segurança.", "Levante o joelho direito até a altura do quadril e abaixe. Repita com o esquerdo.", "Balance os braços naturalmente, como se estivesse caminhando de verdade.", "Mantenha um ritmo confortável por 15 minutos. Descanse 1 minuto se precisar.", "Ao terminar, respire fundo 3 vezes e caminhe devagar por 1 minuto para desaquecer."],
    tip: "Use calçados confortáveis e antiderrapantes. Pare se sentir tontura." },
  { id: 6, name: "Flexão dos Joelhos", category: "Força", duration: 10, level: "Moderado", icon: <Shield size={22} />, benefit: "Fortalece pernas e melhora sustentação",
    steps: ["Fique em pé atrás de uma cadeira resistente, segurando o encosto com as duas mãos.", "Afaste os pés na largura dos ombros, com os dedos apontados levemente para fora.", "Dobre os joelhos lentamente, como se fosse sentar, descendo até sentir conforto (não passe 90°).", "Suba lentamente, contraindo os glúteos. Não trave os joelhos ao subir.", "Faça 3 séries de 10 repetições, descansando 1 minuto entre cada série."],
    tip: "Os joelhos não devem ultrapassar a ponta dos pés. Vá devagar e com controle." },
  { id: 7, name: "Alongamento das Costas", category: "Alongamento", duration: 8, level: "Fácil", icon: <Heart size={22} />, benefit: "Alivia dores lombares e relaxa a coluna",
    steps: ["Sente-se no meio de uma cadeira firme, com os pés no chão e joelhos dobrados a 90°.", "Cruze os braços sobre o peito e incline o tronco para a frente, em direção às coxas.", "Segure por 10 segundos sentindo o alongamento nas costas.", "Volte lentamente à posição inicial usando os músculos abdominais.", "Repita 5 vezes. Para variar, incline levemente para os lados também."],
    tip: "Se sentir dor aguda nas costas, pare imediatamente e consulte um médico." },
  { id: 8, name: "Elevação dos Braços", category: "Força", duration: 10, level: "Fácil", icon: <Star size={22} />, benefit: "Fortalece ombros e melhora alcance",
    steps: ["Sente-se com as costas eretas, pés no chão. Segure uma garrafa de água em cada mão (opcional).", "Com os braços ao lado do corpo, levante ambos os braços lateralmente até a altura dos ombros.", "Segure por 2 segundos na posição elevada e desça lentamente.", "Faça o mesmo movimento elevando os braços à frente do corpo.", "Faça 3 séries de 10 repetições de cada variação, descansando entre as séries."],
    tip: "Comece sem peso. Adicione a garrafa d'água somente quando sentir facilidade." },
];

const initialFriends: Friend[] = [
  { id: 1, name: "Maria Silva", avatar: "MS", lastMessage: "Fiz todos os exercícios hoje! 😊", time: "09:23", unread: 2, messages: [{ id: 1, sender: "them", text: "Bom dia! Tudo bem com você?", time: "09:10" }, { id: 2, sender: "me", text: "Bom dia Maria! Tudo ótimo, e você?", time: "09:15" }, { id: 3, sender: "them", text: "Fiz todos os exercícios hoje! 😊", time: "09:23" }] },
  { id: 2, name: "José Santos", avatar: "JS", lastMessage: "Como você está se sentindo?", time: "Ontem", unread: 0, messages: [{ id: 1, sender: "them", text: "Oi! Fez os exercícios de ontem?", time: "16:40" }, { id: 2, sender: "me", text: "Fiz sim! Fiquei um pouco cansado mas valeu.", time: "16:55" }, { id: 3, sender: "them", text: "Como você está se sentindo?", time: "17:02" }] },
  { id: 3, name: "Ana Oliveira", avatar: "AO", lastMessage: "Vamos fazer a caminhada juntas amanhã?", time: "Ontem", unread: 1, messages: [{ id: 1, sender: "me", text: "Ana, que tal a gente fazer os exercícios juntas?", time: "14:20" }, { id: 2, sender: "them", text: "Que ótima ideia!", time: "14:35" }, { id: 3, sender: "them", text: "Vamos fazer a caminhada juntas amanhã?", time: "14:36" }] },
  { id: 4, name: "Roberto Lima", avatar: "RL", lastMessage: "Obrigado pela dica de exercício!", time: "Seg", unread: 0, messages: [{ id: 1, sender: "me", text: "Roberto, experimentou o alongamento das costas?", time: "10:00" }, { id: 2, sender: "them", text: "Sim! Ficou muito melhor.", time: "10:45" }, { id: 3, sender: "them", text: "Obrigado pela dica de exercício!", time: "10:46" }] },
  { id: 5, name: "João Oliveira", avatar: "JO", isTutor: true, lastMessage: "Lembre-se de fazer os exercícios hoje! 💪", time: "08:15", unread: 1, messages: [{ id: 1, sender: "them", text: "Bom dia! Como você está se sentindo hoje?", time: "08:10" }, { id: 2, sender: "me", text: "Bom dia João! Estou bem, obrigada!", time: "08:13" }, { id: 3, sender: "them", text: "Lembre-se de fazer os exercícios hoje! 💪", time: "08:15" }] },
];

const initialGroups: Group[] = [
  { id: 1, name: "Turma da Manhã", emoji: "🌅", members: 12, memberList: [{ name: "João Oliveira", initials: "JO", isTutor: true }, { name: "Maria Silva", initials: "MS" }, { name: "Ana Oliveira", initials: "AO" }, { name: "Roberto Lima", initials: "RL" }, { name: "Carmen Souza", initials: "CS" }, { name: "Lúcia Mendes", initials: "LM" }, { name: "Paulo Ferreira", initials: "PF" }, { name: "Beatriz Costa", initials: "BC" }, { name: "Antônio Ramos", initials: "AR" }, { name: "Helena Vieira", initials: "HV" }, { name: "Francisco Lima", initials: "FL" }, { name: "Tereza Neves", initials: "TN" }], lastMessage: "João (Tutor): Ótimo trabalho hoje!", time: "08:20", unread: 5, hasLiveEvent: true, messages: [{ id: 1, sender: "them", text: "Bom dia turma! Prontos para os exercícios?", time: "08:00", senderName: "Carmen" }, { id: 2, sender: "me", text: "Prontos! Vamos lá! 💪", time: "08:04" }, { id: 3, sender: "them", text: "Bom dia a todos!", time: "08:07", senderName: "Carmen" }, { id: 4, sender: "them", text: "Ótimo trabalho hoje! Continuem assim, estou acompanhando o progresso de vocês 🌟", time: "08:20", senderName: "João Oliveira", isTutor: true },
      { id: 5, sender: "them", text: "", time: "08:25", senderName: "João Oliveira", isTutor: true, event: { title: "Alongamento Matinal em Grupo", activityType: "Alongamento", participants: 8, scheduledAt: "Hoje às 09:00", host: "João Oliveira" } }] },
  { id: 2, name: "Saúde em Família", emoji: "❤️", members: 8, memberList: [{ name: "João Oliveira", initials: "JO", isTutor: true }, { name: "José Santos", initials: "JS" }, { name: "Roberto Lima", initials: "RL" }, { name: "Fernanda Santos", initials: "FS" }, { name: "Ricardo Oliveira", initials: "RO" }, { name: "Mariana Costa", initials: "MC" }, { name: "Sandra Lima", initials: "SL" }, { name: "Carlos Mendes", initials: "CM" }], lastMessage: "Filha: Mamãe, lembrou de beber água?", time: "11:30", unread: 1, messages: [{ id: 1, sender: "them", text: "Mamãe fez os exercícios hoje?", time: "10:00" }, { id: 2, sender: "me", text: "Fiz sim minha filha! Tô muito bem.", time: "10:30" }, { id: 3, sender: "them", text: "Filha: Mamãe, lembrou de beber água?", time: "11:30" }] },
  { id: 3, name: "Viz. Alegre", emoji: "🏠", members: 24, memberList: [{ name: "João Oliveira", initials: "JO", isTutor: true }, { name: "Maria Silva", initials: "MS" }, { name: "José Santos", initials: "JS" }, { name: "Lúcia Mendes", initials: "LM" }, { name: "Paulo Ferreira", initials: "PF" }, { name: "Clara Rocha", initials: "CR" }, { name: "Davi Alves", initials: "DA" }, { name: "Elisa Pinto", initials: "EP" }, { name: "Fábio Cunha", initials: "FC" }, { name: "Glória Teixeira", initials: "GT" }, { name: "Hugo Barbosa", initials: "HB" }, { name: "Ivone Castro", initials: "IC" }, { name: "Jorge Moura", initials: "JM" }, { name: "Kátia Lopes", initials: "KL" }], lastMessage: "Dona Lúcia: Amanhã tem aula de yoga!", time: "Ontem", unread: 0, messages: [{ id: 1, sender: "them", text: "Pessoal, alguém fez a caminhada hoje?", time: "09:00" }, { id: 2, sender: "me", text: "Eu fiz! Meia hora no parque.", time: "09:30" }, { id: 3, sender: "them", text: "Dona Lúcia: Amanhã tem aula de yoga!", time: "10:15" }] },
  { id: 4, name: "Clube Ativo 60+", emoji: "🌟", members: 31, memberList: [{ name: "Ana Tutora", initials: "AT", isTutor: true }, { name: "João Oliveira", initials: "JO", isTutor: true }, { name: "Ana Oliveira", initials: "AO" }, { name: "Roberto Lima", initials: "RL" }, { name: "Tereza Neves", initials: "TN" }, { name: "Benedito Souza", initials: "BS" }, { name: "Conceição Ramos", initials: "CR" }, { name: "Dalva Pereira", initials: "DP" }, { name: "Edson Melo", initials: "EM" }, { name: "Fátima Gomes", initials: "FG" }], lastMessage: "Coordenador: Parabéns a todos!", time: "Seg", unread: 0, messages: [{ id: 1, sender: "them", text: "Vocês estão arrasando nos exercícios!", time: "15:00" }, { id: 2, sender: "me", text: "Obrigada! Cada dia melhorando.", time: "15:20" }, { id: 3, sender: "them", text: "Coordenador: Parabéns a todos!", time: "16:00" }] },
];

// Which friends already did each exercise today (by exercise id)
const friendsDoneToday: Record<number, { name: string; avatar: string; isTutor?: boolean }[]> = {
  1: [{ name: "Maria Silva", avatar: "MS" }, { name: "Ana Oliveira", avatar: "AO" }],
  2: [{ name: "Maria Silva", avatar: "MS" }],
  3: [{ name: "Roberto Lima", avatar: "RL" }, { name: "Ana Oliveira", avatar: "AO" }],
  4: [{ name: "Maria Silva", avatar: "MS" }, { name: "José Santos", avatar: "JS" }, { name: "João Oliveira", avatar: "JO", isTutor: true }],
  5: [{ name: "Ana Oliveira", avatar: "AO" }, { name: "João Oliveira", avatar: "JO", isTutor: true }],
  6: [],
  7: [{ name: "Roberto Lima", avatar: "RL" }],
  8: [{ name: "Maria Silva", avatar: "MS" }, { name: "José Santos", avatar: "JS" }],
};

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
  const friends = friendsDoneToday[exercise.id] ?? [];

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

function ExercisesView({ completed, onToggle, userName }: { completed: Set<number>; onToggle: (id: number) => void; userName: string }) {
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const categories = ["Todos", "Alongamento", "Equilíbrio", "Cardio", "Força", "Respiração"];
  const filtered = filter === "Todos" ? exercises : exercises.filter((e) => e.category === filter);
  const doneCount = exercises.filter((e) => completed.has(e.id)).length;

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {selected && (
        <ExerciseModal
          exercise={selected}
          completed={completed.has(selected.id)}
          onToggle={() => onToggle(selected.id)}
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
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(doneCount / exercises.length) * 100}%` }} />
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
        {filtered.map((ex) => {
          const done = completed.has(ex.id);
          const doneFriends = friendsDoneToday[ex.id] ?? [];
          return (
            <div
              key={ex.id}
              onClick={() => setSelected(ex)}
              className={`w-full text-left bg-card rounded-2xl p-4 border transition-all duration-200 hover:shadow-sm active:scale-[0.99] cursor-pointer ${done ? "border-secondary/30 bg-[#F4FAF5]" : "border-border"}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${done ? "bg-secondary text-white" : categoryColors[ex.category] || "bg-muted text-muted-foreground"}`}>
                  {done ? <Check size={22} /> : ex.icon}
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

interface FriendRequest {
  id: number;
  name: string;
  initials: string;
  mutualGroup: string;
  isTutor?: boolean;
}

const initialRequests: FriendRequest[] = [
  { id: 101, name: "Carmen Souza", initials: "CS", mutualGroup: "Turma da Manhã" },
  { id: 102, name: "Paulo Ferreira", initials: "PF", mutualGroup: "Viz. Alegre" },
];

function FriendsView({ autoOpenFriendId, onAutoOpenHandled }: { autoOpenFriendId?: number; onAutoOpenHandled?: () => void }) {
  const [friends, setFriends] = useState(initialFriends);
  const [requests, setRequests] = useState<FriendRequest[]>(initialRequests);
  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);

  useEffect(() => {
    if (!autoOpenFriendId) return;
    const friend = friends.find((f) => f.id === autoOpenFriendId);
    if (friend) openChat(friend);
    onAutoOpenHandled?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenFriendId]);

  const openChat = (friend: Friend) => {
    setFriends((prev) => prev.map((f) => (f.id === friend.id ? { ...f, unread: 0 } : f)));
    setActiveFriend({ ...friend, unread: 0 });
  };

  const acceptRequest = (req: FriendRequest) => {
    const newFriend: Friend = {
      id: req.id,
      name: req.name,
      avatar: req.initials,
      isTutor: req.isTutor,
      lastMessage: "Agora vocês são amigos! Diga olá 👋",
      time: "agora",
      unread: 0,
      messages: [{ id: 1, sender: "them", text: "Oi! Que bom que aceitou meu convite 😊", time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }],
    };
    setFriends((prev) => [newFriend, ...prev]);
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  };

  const declineRequest = (id: number) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const sendMessage = (text: string) => {
    if (!activeFriend) return;
    const newMsg: Message = { id: Date.now(), sender: "me", text, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) };
    const updated = { ...activeFriend, messages: [...activeFriend.messages, newMsg], lastMessage: text };
    setActiveFriend(updated);
    setFriends((prev) => prev.map((f) => (f.id === activeFriend.id ? updated : f)));
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
          {requests.length === 0 && (
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
  const [groups, setGroups] = useState(initialGroups);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);

  const openGroup = (group: Group) => {
    setGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, unread: 0 } : g)));
    setActiveGroup({ ...group, unread: 0 });
  };

  const sendMessage = (text: string) => {
    if (!activeGroup) return;
    const newMsg: Message = { id: Date.now(), sender: "me", text, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) };
    const updated = { ...activeGroup, messages: [...activeGroup.messages, newMsg], lastMessage: `Você: ${text}` };
    setActiveGroup(updated);
    setGroups((prev) => prev.map((g) => (g.id === activeGroup.id ? updated : g)));
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

// ─── Senior App ───────────────────────────────────────────────────────────────

// Tutor friend id that seniors can reach for help
const TUTOR_FRIEND_ID = 5;

function SeniorApp({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("exercises");
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [helpOpen, setHelpOpen] = useState(false);
  const [openTutorChat, setOpenTutorChat] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<Set<string>>(new Set());

  const friendNames = new Set(initialFriends.map((f) => f.name));
  const handleInvite = (name: string) => setPendingInvites((prev) => new Set([...prev, name]));

  const toggleExercise = (id: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
            <Heart size={12} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-primary" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {userName.split(" ")[0]}
          </span>
        </div>
        <button
          onClick={() => setHelpOpen(true)}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-border transition-colors font-semibold text-base"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          ?
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "exercises" && <ExercisesView completed={completed} onToggle={toggleExercise} userName={userName} />}
        {tab === "friends" && (
          <FriendsView
            autoOpenFriendId={openTutorChat ? TUTOR_FRIEND_ID : undefined}
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
  const [session, setSession] = useState<{ role: Role; name: string } | null>(null);

  const handleLogin = (role: Role, name: string) => setSession({ role, name });
  const handleLogout = () => setSession(null);

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
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 bg-foreground rounded-sm opacity-80" />
            <div className="w-1 h-1 bg-foreground rounded-full opacity-80" />
          </div>
        </div>

        {!session && <LoginScreen onLogin={handleLogin} />}
        {session?.role === "senior" && <SeniorApp userName={session.name} onLogout={handleLogout} />}
        {session?.role === "tutor" && <TutorApp tutorName={session.name} onLogout={handleLogout} />}
      </div>
    </div>
  );
}
