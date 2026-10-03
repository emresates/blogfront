import type {
  ApiResponse,
  AuthResponseData,
  CurrentUser,
} from "../../types/index";
import { ApiError, type ApiTransport } from "../api/transport.ts";

export interface AuthSnapshot {
  accessToken: string | null;
  user: CurrentUser | null;
  loading: boolean;
}
export const initialAuthSnapshot: AuthSnapshot = {
  accessToken: null,
  user: null,
  loading: true,
};
export type SessionEnd = { disabled: boolean; message: string };
const excluded = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
]);
const isDisabled = (error: unknown) =>
  error instanceof ApiError && error.errCode?.toLowerCase() === "userdisabled";
const isUnauthorized = (error: unknown) =>
  error instanceof ApiError && error.status === 401;

// One instance per browser runtime. Refresh tokens never enter this store.
export function createAuthSession(send: ApiTransport) {
  let state: AuthSnapshot = initialAuthSnapshot;
  let generation = 0;
  let refreshBlocked = false;
  let notified = false;
  let refreshPromise: Promise<string> | null = null;
  let initializationPromise: Promise<void> | null = null;
  let logoutPromise: Promise<void> | null = null;
  let authenticationPromise: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const endListeners = new Set<(event: SessionEnd) => void>();
  const publish = (next: AuthSnapshot) => {
    state = next;
    listeners.forEach((fn) => fn());
  };
  const stale = () =>
    new ApiError(
      "Oturum değişti. Lütfen tekrar giriş yapın.",
      401,
      "sessionChanged",
    );
  function endSession(error: unknown, notify: boolean) {
    const disabled = isDisabled(error);
    if (!refreshBlocked || state.accessToken || state.user) generation++;
    refreshBlocked = true;
    publish({ accessToken: null, user: null, loading: false });
    if ((notify || disabled) && !notified) {
      notified = true;
      endListeners.forEach((fn) =>
        fn({
          disabled,
          message: disabled
            ? "Hesabınız devre dışı bırakılmış."
            : "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
        }),
      );
    }
  }
  function tokenFrom(response: ApiResponse<AuthResponseData>): string {
    if (
      !response.data ||
      typeof response.data.accessToken !== "string" ||
      !response.data.accessToken.trim()
    )
      throw new ApiError("Sunucu geçerli oturum bilgisi döndürmedi.", 502);
    return response.data.accessToken;
  }
  function withToken(options: RequestInit, token: string | null): RequestInit {
    const headers = new Headers(options.headers);
    headers.delete("Authorization");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return { ...options, headers, credentials: "include" };
  }
  function refreshAccessToken(notify = true): Promise<string> {
    if (refreshPromise) return refreshPromise;
    if (refreshBlocked || logoutPromise) return Promise.reject(stale());
    const epoch = generation;
    const pending = (async () => {
      try {
        // Intentionally no body and no recursive api() call.
        const response = await send<AuthResponseData>("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (epoch !== generation) throw stale();
        const token = tokenFrom(response);
        publish({ ...state, accessToken: token });
        return token;
      } catch (error) {
        if (epoch === generation) endSession(error, notify);
        throw error;
      }
    })();
    refreshPromise = pending;
    const release = () => {
      if (refreshPromise === pending) refreshPromise = null;
    };
    void pending.then(release, release);
    return pending;
  }
  async function request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    if (initializationPromise && state.loading) await initializationPromise;
    const epoch = generation;
    const token = state.accessToken;
    try {
      return await send<T>(path, withToken(options, token));
    } catch (error) {
      if (options.signal?.aborted || epoch !== generation) throw error;
      if (isDisabled(error)) {
        endSession(error, true);
        throw error;
      }
      if (!isUnauthorized(error) || excluded.has(path.split("?")[0]))
        throw error;
      if (refreshBlocked) {
        endSession(error, true);
        throw error;
      }
      // A slower 401 may arrive after another request has already refreshed.
      const nextToken =
        state.accessToken && state.accessToken !== token
          ? state.accessToken
          : await refreshAccessToken();
      if (epoch !== generation || options.signal?.aborted) throw stale();
      try {
        return await send<T>(path, withToken(options, nextToken));
      } catch (retryError) {
        if (
          epoch === generation &&
          (isUnauthorized(retryError) || isDisabled(retryError))
        )
          endSession(retryError, true);
        throw retryError; // exactly one retry; 403 never refreshes
      }
    }
  }
  async function readCurrentUser(epoch: number) {
    const response = await send<CurrentUser>(
      "/api/auth/me",
      withToken({}, state.accessToken),
    );
    if (epoch !== generation) throw stale();
    if (!response.data || !response.data.userId || !response.data.role)
      throw new ApiError("Kullanıcı bilgisi alınamadı.", 502);
    publish({ ...state, user: response.data, loading: false });
    return response.data;
  }
  function initialize(): Promise<void> {
    if (initializationPromise) return initializationPromise;
    if (state.user && state.accessToken)
      return (initializationPromise = Promise.resolve());
    const epoch = generation;
    initializationPromise = (async () => {
      try {
        await refreshAccessToken(false);
        await readCurrentUser(epoch);
      } catch (error) {
        if (epoch === generation) endSession(error, false);
      } finally {
        if (epoch === generation && state.loading)
          publish({ ...state, loading: false });
      }
    })();
    return initializationPromise;
  }
  function authenticate(
    path: "/api/auth/login" | "/api/auth/register",
    fields: { name?: string; email: string; password: string },
  ): Promise<void> {
    if (authenticationPromise) return authenticationPromise;
    const pendingInitialization = initializationPromise;
    const pendingLogout = logoutPromise;
    const pendingRefresh = refreshPromise;
    const epoch = ++generation;
    refreshBlocked = true;
    notified = false;
    publish({ accessToken: null, user: null, loading: true });
    const pending = (async () => {
      // Capture earlier operations: a later logout must not create a wait cycle.
      if (pendingInitialization) await pendingInitialization;
      if (pendingLogout) await pendingLogout.catch(() => {});
      if (pendingRefresh) await pendingRefresh.catch(() => {});
      if (epoch !== generation) throw stale();
      refreshBlocked = false;
      try {
        const response = await send<AuthResponseData>(path, {
          method: "POST",
          credentials: "include",
          body: JSON.stringify(fields),
        });
        if (epoch !== generation) throw stale();
        publish({ ...state, accessToken: tokenFrom(response) });
        await readCurrentUser(epoch);
      } catch (error) {
        if (epoch === generation) endSession(error, false);
        throw error;
      }
    })();
    authenticationPromise = pending;
    const release = () => {
      if (authenticationPromise === pending) authenticationPromise = null;
    };
    void pending.then(release, release);
    return pending;
  }
  function logout(): Promise<void> {
    if (logoutPromise) return logoutPromise;
    const pendingRefresh = refreshPromise;
    const pendingAuthentication = authenticationPromise;
    const token = state.accessToken;
    ++generation;
    refreshBlocked = true;
    notified = true;
    publish({ accessToken: null, user: null, loading: false });
    const pending = (async () => {
      // A late Set-Cookie must land before logout revokes the rotated cookie.
      if (pendingRefresh) await pendingRefresh.catch(() => {});
      if (pendingAuthentication) await pendingAuthentication.catch(() => {});
      try {
        await send<null>(
          "/api/auth/logout",
          withToken({ method: "POST", credentials: "include" }, token),
        );
      } finally {
        publish({ accessToken: null, user: null, loading: false });
      }
    })();
    logoutPromise = pending;
    const release = () => {
      if (logoutPromise === pending) logoutPromise = null;
    };
    void pending.then(release, release);
    return pending;
  }
  async function loadCurrentUser() {
    const epoch = generation;
    const response = await request<CurrentUser>("/api/auth/me");
    if (epoch === generation) publish({ ...state, user: response.data });
    return response.data;
  }
  return {
    request,
    initialize,
    refreshAccessToken,
    loadCurrentUser,
    logout,
    login: (email: string, password: string) =>
      authenticate("/api/auth/login", { email, password }),
    register: (name: string, email: string, password: string) =>
      authenticate("/api/auth/register", { name, email, password }),
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    onSessionEnd: (listener: (event: SessionEnd) => void) => {
      endListeners.add(listener);
      return () => {
        endListeners.delete(listener);
      };
    },
  };
}
