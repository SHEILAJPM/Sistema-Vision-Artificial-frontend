import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthProvider.jsx";

// Contraparte de AuthProvider.test.jsx con USE_MOCK_DATA=false: cubre el
// camino real contra backend (login por API, invalidacion por 401).
const api = vi.hoisted(() => ({
  getStoredToken: vi.fn(),
  setStoredToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
  postLogin: vi.fn(),
  postLogout: vi.fn(),
  getMe: vi.fn(),
}));

vi.mock("../lib/api.js", () => ({ USE_MOCK_DATA: false, ...api }));
vi.mock("../data/mockData.js", () => ({ mockUsers: [] }));

function Consumer() {
  const { user, isAuthenticated, authChecked, login } = useAuth();
  return (
    <div>
      <p data-testid="checked">{String(authChecked)}</p>
      <p data-testid="auth">{String(isAuthenticated)}</p>
      <p data-testid="user">{user ? user.name : "ninguno"}</p>
      <button onClick={() => login("op1", "secreta")}>login</button>
    </div>
  );
}

describe("AuthProvider (modo real)", () => {
  let unauthorizedHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    api.getStoredToken.mockReturnValue(null);
    api.setUnauthorizedHandler.mockImplementation((fn) => {
      unauthorizedHandler = fn;
    });
  });

  it("un 401 al validar el token guardado cierra la sesion", async () => {
    api.getStoredToken.mockReturnValue("token-viejo");
    api.getMe.mockRejectedValue(new Error("Sesión inválida o expirada"));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("checked")).toHaveTextContent("true"));
    expect(screen.getByTestId("auth")).toHaveTextContent("false");
    expect(api.setStoredToken).toHaveBeenCalledWith(null);
  });

  it("un 401 a mitad de sesion (via unauthorizedHandler) desloguea sin recargar", async () => {
    api.getMe.mockResolvedValue({ name: "Op", role: "Operador" });
    api.getStoredToken.mockReturnValue("token-valido");

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("true"));

    unauthorizedHandler();

    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("false"));
  });

  it("login exitoso guarda el token y el usuario que devuelve el backend", async () => {
    api.postLogin.mockResolvedValue({ token: "abc123", user: { name: "Op1", role: "Operador" } });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("checked")).toHaveTextContent("true"));

    screen.getByText("login").click();

    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("true"));
    expect(api.setStoredToken).toHaveBeenCalledWith("abc123");
    expect(screen.getByTestId("user")).toHaveTextContent("Op1");
  });

  it("credenciales rechazadas por el backend no autentican", async () => {
    api.postLogin.mockRejectedValue(new Error("HTTP 401"));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("checked")).toHaveTextContent("true"));

    screen.getByText("login").click();

    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("false"));
  });
});
