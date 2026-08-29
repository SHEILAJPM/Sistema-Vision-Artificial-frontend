import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthProvider.jsx";

// USE_MOCK_DATA fijo en true: cubre el flujo de demo (sin backend), que es
// el modo en el que corre este repo por defecto (VITE_USE_MOCK_DATA=true).
vi.mock("../lib/api.js", () => ({
  USE_MOCK_DATA: true,
  getStoredToken: vi.fn(() => null),
  setStoredToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
  postLogin: vi.fn(),
  postLogout: vi.fn(),
  getMe: vi.fn(),
}));

vi.mock("../data/mockData.js", () => ({
  mockUsers: [{ id: 1, username: "jrodriguez", name: "Jose Rodriguez", role: "Operador" }],
}));

function Consumer() {
  const { user, isAuthenticated, authChecked, login, logout } = useAuth();
  const [error, setError] = useState(null);
  return (
    <div>
      <p data-testid="checked">{String(authChecked)}</p>
      <p data-testid="auth">{String(isAuthenticated)}</p>
      <p data-testid="user">{user ? `${user.name} (${user.role})` : "ninguno"}</p>
      <p data-testid="error">{error ?? ""}</p>
      <button
        onClick={async () => {
          const res = await login("jrodriguez", "cualquier-cosa");
          if (!res.ok) setError(res.error);
        }}
      >
        login-conocido
      </button>
      <button
        onClick={async () => {
          const res = await login("", "");
          if (!res.ok) setError(res.error);
        }}
      >
        login-vacio
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe("AuthProvider (modo mock)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("arranca sin sesion cuando no hay token guardado", async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("checked")).toHaveTextContent("true"));
    expect(screen.getByTestId("auth")).toHaveTextContent("false");
  });

  it("login con un usuario conocido de mockUsers entra con su rol real", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await user.click(screen.getByText("login-conocido"));

    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("true"));
    expect(screen.getByTestId("user")).toHaveTextContent("Jose Rodriguez (Operador)");
  });

  it("login con campos vacios no autentica y devuelve un error legible", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await user.click(screen.getByText("login-vacio"));

    expect(screen.getByTestId("auth")).toHaveTextContent("false");
    await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("Ingresa usuario y contraseña"));
  });

  it("logout limpia el usuario y el token de demo guardado", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await user.click(screen.getByText("login-conocido"));
    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("true"));

    await user.click(screen.getByText("logout"));

    expect(screen.getByTestId("auth")).toHaveTextContent("false");
    expect(localStorage.getItem("inspectaline_mock_user")).toBeNull();
  });
});
