import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SystemProvider, useSystem } from "./SystemProvider.jsx";

// Cubre el flujo real (USE_MOCK_DATA=false): carga inicial via refreshAll,
// el patch optimista de sendCommand, y la reconciliacion cuando el comando
// falla -- la logica mas propensa a romperse en un refactor silencioso.
const api = vi.hoisted(() => ({
  getStoredToken: vi.fn(() => "token"),
  getStatus: vi.fn(),
  getStats: vi.fn(),
  getEvents: vi.fn(),
  getSettings: vi.fn(),
  postControl: vi.fn(),
  postSettings: vi.fn(),
  getModelStatus: vi.fn(),
  getModelComparison: vi.fn(),
  postModelSelect: vi.fn(),
  resolveMediaUrl: vi.fn((p) => p),
}));

vi.mock("../lib/api.js", () => ({
  WS_URL: "ws://test",
  POLL_INTERVAL_MS: 999999,
  USE_MOCK_DATA: false,
  ...api,
}));

vi.mock("../lib/useWebSocket.js", () => ({
  useWebSocket: () => ({ connected: false, send: vi.fn() }),
}));

vi.mock("../data/mockData.js", () => ({
  mockStatus: {},
  mockStats: {},
  mockEvents: [],
  mockSettings: {},
  mockDetections: {},
  mockModelStatus: {},
  mockModelComparison: {},
}));

function Consumer() {
  const { status, statsLoaded, lastError, sendCommand } = useSystem();
  return (
    <div>
      <p data-testid="banda">{status?.banda ?? "null"}</p>
      <p data-testid="loaded">{String(statsLoaded)}</p>
      <p data-testid="error">{lastError ?? ""}</p>
      <button onClick={() => sendCommand("START")}>start</button>
    </div>
  );
}

describe("SystemProvider (modo real)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getStoredToken.mockReturnValue("token");
    api.getStatus.mockResolvedValue({ banda: "stopped", luz: "off", esp32: "connected" });
    api.getStats.mockResolvedValue({ today: { inspected: 0, rejected: 0, rejectRate: 0 }, trend: [], distribution: {} });
    api.getEvents.mockResolvedValue([]);
    api.getSettings.mockResolvedValue({});
    api.getModelStatus.mockResolvedValue({});
    api.getModelComparison.mockResolvedValue({});
  });

  it("carga el estado inicial via refreshAll al montar", async () => {
    render(
      <SystemProvider>
        <Consumer />
      </SystemProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("true"));
    expect(screen.getByTestId("banda")).toHaveTextContent("stopped");
  });

  it("aplica el patch optimista antes de que postControl resuelva", async () => {
    let resolvePost;
    api.postControl.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      })
    );

    render(
      <SystemProvider>
        <Consumer />
      </SystemProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("true"));

    screen.getByText("start").click();

    await waitFor(() => expect(screen.getByTestId("banda")).toHaveTextContent("running"));

    resolvePost({});
    // Deja que el refreshAll posterior a postControl termine de asentarse.
    await waitFor(() => expect(api.getStatus).toHaveBeenCalledTimes(2));
  });

  it("si postControl falla, reconcilia contra el estado real y expone el error", async () => {
    api.postControl.mockRejectedValue(new Error("Arduino desconectado"));

    render(
      <SystemProvider>
        <Consumer />
      </SystemProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("true"));

    screen.getByText("start").click();

    await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("Arduino desconectado"));
    await waitFor(() => expect(screen.getByTestId("banda")).toHaveTextContent("stopped"));
  });
});
