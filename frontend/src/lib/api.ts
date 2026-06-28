// Thin typed client for the FastAPI backend.
// All requests go to /api/* which Vite proxies to the backend (see vite.config.ts).

const TOKEN_KEY = "sf_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = "Ocorreu um erro. Tente novamente.";
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Shared types (mirror the backend response schemas) ──────────────────────

export type Role = "senior" | "tutor";

export interface SessionUser {
  id: number;
  name: string;
  initials: string;
  role: Role;
  email: string;
}

export interface EventCard {
  title: string;
  activityType: string;
  participants: number;
  scheduledAt: string;
  host: string;
}

export interface Message {
  id: number;
  sender: "me" | "them";
  text: string;
  time: string;
  senderName?: string | null;
  isTutor?: boolean;
  event?: EventCard | null;
}

export interface FriendDone {
  name: string;
  avatar: string;
  isTutor?: boolean;
}

export interface Exercise {
  id: number;
  name: string;
  category: string;
  duration: number;
  level: string;
  icon: string;
  benefit: string;
  steps: string[];
  tip: string;
  completed: boolean;
  friendsDone: FriendDone[];
}

export interface Friend {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isTutor?: boolean;
  messages: Message[];
}

export interface FriendRequest {
  id: number;
  name: string;
  initials: string;
  mutualGroup: string;
  isTutor?: boolean;
}

export interface GroupMemberEntry {
  name: string;
  initials: string;
  isTutor?: boolean;
}

export interface Group {
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

// ─── Tutor types ──────────────────────────────────────────────────────────────

export interface TutorSenior {
  id: number;
  name: string;
  initials: string;
  age: number;
  exercisesThisWeek: number;
  exercisesToday: number;
  streak: number;
  lastActive: string;
  alert?: string | null;
  groups: string[];
}

export interface TutorMember {
  id: number;
  name: string;
  initials: string;
}

export interface TutorChatMessage {
  id: number;
  sender: "tutor" | "member";
  senderName: string;
  text: string;
  time: string;
}

export interface TutorGroup {
  id: number;
  name: string;
  emoji: string;
  description: string;
  members: TutorMember[];
  messages: TutorChatMessage[];
}

export interface TutorAnnouncement {
  id: number;
  targetAll: boolean;
  groupId?: number | null;
  groupName?: string | null;
  text: string;
  time: string;
}

export interface CreatedActivity {
  id: number;
  name: string;
  category: string;
  duration: number;
  level: string;
  icon: string;
  description: string;
  isCustom: boolean;
}

export interface RunningActivity {
  id: number;
  name: string;
  category: string;
  icon: string;
  duration: number;
  groupId: number;
  groupName: string;
  startedLabel: string;
  completedCount: number;
  totalMembers: number;
  completors: string[];
}

export interface AssignedActivity {
  id: number;
  name: string;
  category: string;
  duration: number;
  level: string;
  icon: string;
  description: string;
  groupName: string;
  completed: boolean;
}

export interface LiveEvent {
  id: number;
  title: string;
  activityType: string;
  scheduledAt: string;
  duration: number;
  description: string;
  status: "saved" | "sent";
  sentToGroup?: string | null;
  sentAt?: string | null;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: SessionUser;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<SessionUser>("/auth/me"),

  listExercises: () => request<Exercise[]>("/exercises"),
  toggleExercise: (id: number) =>
    request<{ completed: boolean }>(`/exercises/${id}/toggle`, { method: "POST" }),
  listAssignedActivities: () => request<AssignedActivity[]>("/exercises/assigned"),
  toggleAssignedActivity: (id: number) =>
    request<{ completed: boolean }>(`/exercises/assigned/${id}/toggle`, { method: "POST" }),

  listFriends: () => request<Friend[]>("/friends"),
  listFriendRequests: () => request<FriendRequest[]>("/friends/requests"),
  acceptFriendRequest: (id: number) =>
    request<Friend>(`/friends/requests/${id}/accept`, { method: "POST" }),
  declineFriendRequest: (id: number) =>
    request<{ ok: boolean }>(`/friends/requests/${id}/decline`, { method: "POST" }),
  sendFriendMessage: (friendId: number, text: string) =>
    request<Message>(`/friends/${friendId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  listGroups: () => request<Group[]>("/groups"),
  sendGroupMessage: (groupId: number, text: string) =>
    request<Message>(`/groups/${groupId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  // ── Tutor ──
  listSeniors: () => request<TutorSenior[]>("/tutor/seniors"),
  listSeniorMessages: (seniorId: number) =>
    request<TutorChatMessage[]>(`/tutor/seniors/${seniorId}/messages`),
  sendSeniorMessage: (seniorId: number, text: string) =>
    request<TutorChatMessage>(`/tutor/seniors/${seniorId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  listTutorGroups: () => request<TutorGroup[]>("/tutor/groups"),
  createTutorGroup: (data: { name: string; emoji: string; description: string }) =>
    request<TutorGroup>("/tutor/groups", { method: "POST", body: JSON.stringify(data) }),
  deleteTutorGroup: (id: number) =>
    request<{ ok: boolean }>(`/tutor/groups/${id}`, { method: "DELETE" }),
  addGroupMember: (groupId: number, seniorId: number) =>
    request<TutorGroup>(`/tutor/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ senior_id: seniorId }),
    }),
  removeGroupMember: (groupId: number, seniorId: number) =>
    request<TutorGroup>(`/tutor/groups/${groupId}/members/${seniorId}`, { method: "DELETE" }),
  sendTutorGroupMessage: (groupId: number, text: string) =>
    request<TutorChatMessage>(`/tutor/groups/${groupId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  listAnnouncements: () => request<TutorAnnouncement[]>("/tutor/announcements"),
  createAnnouncement: (text: string, groupId: number | null) =>
    request<TutorAnnouncement>("/tutor/announcements", {
      method: "POST",
      body: JSON.stringify({ text, group_id: groupId }),
    }),
  listTutorActivities: () => request<CreatedActivity[]>("/tutor/activities"),
  createTutorActivity: (data: { name: string; category: string; duration: number; description: string }) =>
    request<CreatedActivity>("/tutor/activities", { method: "POST", body: JSON.stringify(data) }),
  deleteTutorActivity: (id: number) =>
    request<{ ok: boolean }>(`/tutor/activities/${id}`, { method: "DELETE" }),
  dispatchActivity: (activityId: number, groupId: number) =>
    request<RunningActivity>(`/tutor/activities/${activityId}/dispatch`, {
      method: "POST",
      body: JSON.stringify({ group_id: groupId }),
    }),
  listRunningActivities: () => request<RunningActivity[]>("/tutor/running"),
  endRunningActivity: (id: number) =>
    request<{ ok: boolean }>(`/tutor/running/${id}`, { method: "DELETE" }),
  listEvents: () => request<LiveEvent[]>("/tutor/events"),
  createEvent: (data: {
    title: string;
    activityType: string;
    scheduledAt: string;
    duration: number;
    description: string;
  }) => request<LiveEvent>("/tutor/events", { method: "POST", body: JSON.stringify(data) }),
  sendEvent: (eventId: number, groupId: number) =>
    request<LiveEvent>(`/tutor/events/${eventId}/send`, {
      method: "POST",
      body: JSON.stringify({ group_id: groupId }),
    }),
  deleteEvent: (id: number) =>
    request<{ ok: boolean }>(`/tutor/events/${id}`, { method: "DELETE" }),
};
