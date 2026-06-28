# Senior Fitness Activity App

Aplicativo de atividade física para idosos (perfis **idoso** e **tutor**), com
exercícios, amigos e grupos. Originalmente um protótipo do Figma Make, agora um
projeto full-stack containerizado.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS v4 (`frontend/`) |
| Backend | FastAPI + SQLAlchemy (`backend/`) |
| Banco de dados | PostgreSQL |
| Orquestração | Docker Compose |

Arquitetura: **cliente-servidor de 3 camadas** (apresentação → API REST → dados),
backend monolítico, organizado como **monorepo**.

## Como rodar (a forma recomendada)

A única coisa que você precisa instalar é o **[Docker](https://docs.docker.com/get-docker/)**
(Docker Desktop no Windows/Mac, ou Docker Engine no Linux). **Não** precisa instalar
Node, Python nem Postgres.

```bash
git clone https://github.com/rafastephanou/senior-fitness-activity-app.git
cd senior-fitness-activity-app
docker compose up --build
```

Isso sobe três serviços de uma vez:

- 🐘 **db** — PostgreSQL (dados)
- 🐍 **backend** — API FastAPI em http://localhost:8000 (docs em http://localhost:8000/docs)
- ⚛️ **frontend** — app React em http://localhost:5173

Abra **http://localhost:5173** no navegador. O banco é criado e populado
automaticamente na primeira execução.

Para parar: `Ctrl+C` e depois `docker compose down` (use `docker compose down -v`
para também apagar o banco e recomeçar do zero).

### Porta 5173 ocupada?

Se a porta 5173 já estiver em uso na sua máquina, copie o `.env.example` para
`.env` e ajuste `FRONTEND_PORT` (ex.: `5174`):

```bash
cp .env.example .env
# edite FRONTEND_PORT=5174 no .env
docker compose up --build
```

## Publicar online (link público)

Para compartilhar o app por um **link** (qualquer pessoa abre no navegador, sem
instalar nada), o repositório já vem pronto para um deploy de **um único serviço**
no [Render](https://render.com) (plano grátis): o FastAPI serve a API **e** a tela
React já compilada, usando SQLite (sem banco separado) com os dados de demonstração
populados automaticamente.

Passo a passo (só na primeira vez):

1. Garanta que o código está no GitHub: `git push`.
2. Crie uma conta grátis em <https://render.com> e conecte seu GitHub.
3. No painel: **New +** → **Blueprint** → escolha este repositório. O Render lê o
   `render.yaml` e cria o serviço sozinho.
4. Aguarde o build (~3–5 min). No final o Render mostra a URL pública
   (ex.: `https://vidaativa.onrender.com`) — é esse link que você compartilha.

Detalhes do plano grátis:

- Na primeira visita após um tempo ocioso o serviço "acorda" em ~30–50s; depois fica rápido.
- O SQLite é efêmero: a cada novo deploy os dados voltam ao estado de demonstração (ótimo para demos).
- Rodar localmente continua igual (`docker compose up --build`, com Postgres). O deploy usa o `Dockerfile` da raiz.

## Contas de demonstração

A conta **totalmente populada** (com amigos, grupos e mensagens) é a da Maria:

| Perfil | E-mail | Senha |
|---|---|---|
| Idoso (demo principal) | `maria@exemplo.com` | `123456` |
| Idoso | `jose@exemplo.com` | `123456` |
| Tutor | `ana@exemplo.com` | `admin123` |
| Tutor | `carlos@exemplo.com` | `admin123` |

> As duas interfaces (**idoso** e **tutor**) já estão 100% ligadas à API.

## Estrutura do repositório

```
.
├─ frontend/            # App React (Vite + Tailwind)
│  └─ src/
│     ├─ app/           # Componentes e telas
│     └─ lib/api.ts     # Cliente HTTP tipado da API
├─ backend/             # API FastAPI
│  └─ app/
│     ├─ core/          # Config, banco, segurança (hash + JWT)
│     ├─ models/        # Modelos SQLAlchemy
│     ├─ schemas/       # Schemas Pydantic (entrada/saída)
│     ├─ api/routes/    # Rotas: auth, exercises, friends, groups
│     ├─ db/seed.py     # Popula o banco com os dados de demonstração
│     └─ main.py        # Cria a app, tabelas e roda o seed
├─ docker-compose.yml   # Orquestra db + backend + frontend
└─ .env.example         # Variáveis de ambiente (copie para .env)
```

## Desenvolvimento

O código é montado nos containers via *bind mount*, então **alterações recarregam
automaticamente**:

- editar arquivos em `frontend/` → o Vite faz hot reload no navegador;
- editar arquivos em `backend/` → o Uvicorn reinicia a API (`--reload`).

Para ver os logs de um serviço: `docker compose logs -f backend` (ou `frontend`, `db`).

### Adicionando funcionalidades ao backend

A estrutura é orientada a domínio para facilitar a expansão (ex.: a interface do
tutor): crie o modelo em `backend/app/models/`, o schema em `backend/app/schemas/`,
e o router em `backend/app/api/routes/`, registrando-o em `backend/app/main.py`.
