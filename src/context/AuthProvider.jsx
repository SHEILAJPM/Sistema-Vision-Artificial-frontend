import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  USE_MOCK_DATA,
  getStoredToken,
  setStoredToken,
  setUnauthorizedHandler,
  postLogin,
  postLogout,
  getMe,
} from "../lib/api.js";
import { mockUsers } from "../data/mockData.js";

const AuthContext = createContext(null);

const MOCK_USER_KEY = "inspectaline_mock_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Al montar: si hay token guardado, se valida contra el backend (o se
  // restaura el usuario de demo en modo mock) antes de decidir si el
  // dashboard se muestra o si hay que mandar a /login.
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    if (USE_MOCK_DATA) {
      const raw = localStorage.getItem(MOCK_USER_KEY);
      setUser(raw ? JSON.parse(raw) : { name: "Operador demo", role: "Operador" });
      setAuthChecked(true);
      return;
    }
    getMe()
      .then((me) => setUser(me))
      .catch(() => setStoredToken(null))
      .finally(() => setAuthChecked(true));
  }, []);

  const logout = useCallback(async () => {
    if (!USE_MOCK_DATA) {
      await postLogout().catch(() => {});
    }
    setStoredToken(null);
    localStorage.removeItem(MOCK_USER_KEY);
    setUser(null);
  }, []);

  // Si cualquier request REST recibe 401 (token vencido/revocado a mitad de
  // sesión), se cierra sesión automáticamente para volver a /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setStoredToken(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (username, password) => {
    if (!username.trim() || !password.trim()) {
      return { ok: false, error: "Ingresa usuario y contraseña" };
    }

    if (USE_MOCK_DATA) {
      await new Promise((r) => setTimeout(r, 400));
      // En modo demo no hay backend que valide credenciales: si el usuario
      // coincide con uno de mockUsers se entra como ese usuario (mismo id,
      // así /usuarios lo reconoce como "tú mismo"); si no, cualquier usuario
      // que contenga "admin" entra como Admin para poder probar la sección.
      const match = mockUsers.find((u) => u.username === username);
      const demoUser = match
        ? { id: match.id, username: match.username, name: match.name, role: match.role }
        : { name: username, role: username.toLowerCase().includes("admin") ? "Admin" : "Operador" };
      setStoredToken("demo-token");
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return { ok: true };
    }

    try {
      const res = await postLogin(username, password);
      setStoredToken(res.token);
      setUser(res.user ?? { name: username });
      return { ok: true };
    } catch {
      return { ok: false, error: "Usuario o contraseña incorrectos" };
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    authChecked,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
