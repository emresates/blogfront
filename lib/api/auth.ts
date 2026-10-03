import { getAuthSession } from "./client";
import { initialAuthSnapshot, type SessionEnd } from "../auth/session";
export const authApi = {
  initialize: () => getAuthSession().initialize(),
  login: (email: string, password: string) =>
    getAuthSession().login(email, password),
  register: (name: string, email: string, password: string) =>
    getAuthSession().register(name, email, password),
  logout: () => getAuthSession().logout(),
  refreshAccessToken: () => getAuthSession().refreshAccessToken(),
  loadCurrentUser: () => getAuthSession().loadCurrentUser(),
  subscribe: (fn: () => void) => getAuthSession().subscribe(fn),
  getSnapshot: () =>
    typeof window === "undefined"
      ? initialAuthSnapshot
      : getAuthSession().getSnapshot(),
  getServerSnapshot: () => initialAuthSnapshot,
  onSessionEnd: (fn: (event: SessionEnd) => void) =>
    getAuthSession().onSessionEnd(fn),
};
