import { useState } from "react";
import { Heart, Shield, Eye, EyeOff, ChevronLeft } from "lucide-react";

type Role = "senior" | "tutor";

interface Props {
  onLogin: (role: Role, name: string) => void;
}

const seniorAccounts = [
  { email: "maria@exemplo.com", password: "123456", name: "Maria Silva" },
  { email: "jose@exemplo.com", password: "123456", name: "José Santos" },
];

const tutorAccounts = [
  { email: "ana@exemplo.com", password: "admin123", name: "Ana Tutora" },
  { email: "carlos@exemplo.com", password: "admin123", name: "Carlos Supervisor" },
];

function LoginForm({
  role,
  onLogin,
  onSwitchToTutor,
  onBackToSenior,
}: {
  role: Role;
  onLogin: (role: Role, name: string) => void;
  onSwitchToTutor: () => void;
  onBackToSenior: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const isTutor = role === "tutor";

  const handleLogin = () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Preencha o e-mail e a senha para continuar.");
      return;
    }
    const accounts = isTutor ? tutorAccounts : seniorAccounts;
    const match = accounts.find((a) => a.email === email.trim());
    const name = match?.name ?? email.trim().split("@")[0];
    onLogin(role, name);
  };

  return (
    <div className="size-full overflow-y-auto flex flex-col px-6 py-6">
      {/* Back button for tutor */}
      {isTutor && (
        <button
          onClick={onBackToSenior}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-4 self-start"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <ChevronLeft size={20} />
          <span className="text-base font-medium">Voltar</span>
        </button>
      )}

      {/* Logo + name */}
      <div className={`flex flex-col items-center ${isTutor ? "mb-6" : "mb-6 mt-2"}`}>
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg mb-4 ${isTutor ? "bg-[#4A52B2]" : "bg-primary"}`}
        >
          {isTutor ? (
            <Shield size={38} className="text-white" />
          ) : (
            <Heart size={38} className="text-white" />
          )}
        </div>
        <h1
          className="text-4xl font-bold text-foreground"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          VidaAtiva
        </h1>
        <p
          className="text-muted-foreground mt-1.5 text-base text-center leading-snug"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {isTutor ? "Área do Tutor" : "Saúde e conexão para toda família"}
        </p>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-5 flex-1">
        <div>
          <label
            className="block font-semibold text-foreground mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.05rem" }}
          >
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder={isTutor ? "tutor@exemplo.com" : "seu@email.com"}
            className="w-full bg-card border-2 border-border rounded-2xl px-5 py-4 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.1rem" }}
          />
        </div>

        <div>
          <label
            className="block font-semibold text-foreground mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.05rem" }}
          >
            Senha
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              className="w-full bg-card border-2 border-border rounded-2xl px-5 py-4 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors pr-14"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.1rem" }}
            />
            <button
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
            </button>
          </div>
        </div>

        {error && (
          <p
            className="text-destructive font-medium text-center"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1rem" }}
          >
            {error}
          </p>
        )}

        {/* Primary action */}
        <button
          onClick={handleLogin}
          className={`w-full py-5 rounded-2xl font-semibold text-white shadow-sm active:scale-[0.98] transition-all mt-1 ${isTutor ? "bg-[#4A52B2] hover:opacity-90" : "bg-primary hover:opacity-90"}`}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.15rem" }}
        >
          Entrar
        </button>

        {/* Secondary: switch to tutor */}
        {!isTutor && (
          <button
            onClick={onSwitchToTutor}
            className="w-full py-4 rounded-2xl font-medium text-muted-foreground border-2 border-border bg-card hover:border-[#4A52B2]/50 hover:text-[#4A52B2] transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1rem" }}
          >
            <Shield size={18} />
            Login de tutor
          </button>
        )}
      </div>
    </div>
  );
}

export function LoginScreen({ onLogin }: Props) {
  const [role, setRole] = useState<Role>("senior");

  return (
    <LoginForm
      role={role}
      onLogin={onLogin}
      onSwitchToTutor={() => setRole("tutor")}
      onBackToSenior={() => setRole("senior")}
    />
  );
}
