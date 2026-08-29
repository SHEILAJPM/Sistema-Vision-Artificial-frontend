import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWebSocket } from "./useWebSocket.js";

// Reemplaza el WebSocket global por un doble controlable a mano: cada
// instancia queda expuesta en `instances` para disparar onopen/onmessage/
// onclose desde el test, en vez de depender de un servidor real.
class FakeWebSocket {
  static instances = [];
  static OPEN = 1;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.close = vi.fn(() => {
      this.readyState = FakeWebSocket.CLOSED;
      this.onclose?.();
    });
    this.send = vi.fn();
    FakeWebSocket.instances.push(this);
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }
}

describe("useWebSocket", () => {
  let originalWebSocket;

  beforeEach(() => {
    originalWebSocket = global.WebSocket;
    global.WebSocket = FakeWebSocket;
    FakeWebSocket.instances = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
    vi.useRealTimers();
  });

  it("se conecta y expone connected=true tras onopen", async () => {
    const { result } = renderHook(() => useWebSocket("ws://test"));
    expect(result.current.connected).toBe(false);

    act(() => FakeWebSocket.instances[0].open());

    expect(result.current.connected).toBe(true);
  });

  it("parsea cada frame JSON y lo pasa a onMessage", () => {
    const onMessage = vi.fn();
    renderHook(() => useWebSocket("ws://test", { onMessage }));
    const ws = FakeWebSocket.instances[0];

    act(() => ws.onmessage({ data: JSON.stringify({ type: "status", data: { banda: "running" } }) }));

    expect(onMessage).toHaveBeenCalledWith({ type: "status", data: { banda: "running" } });
  });

  it("ignora frames no-JSON sin lanzar", () => {
    const onMessage = vi.fn();
    renderHook(() => useWebSocket("ws://test", { onMessage }));
    const ws = FakeWebSocket.instances[0];

    expect(() => act(() => ws.onmessage({ data: "ping" }))).not.toThrow();
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("reintenta con backoff exponencial acotado tras un cierre", () => {
    renderHook(() => useWebSocket("ws://test"));
    const first = FakeWebSocket.instances[0];

    act(() => first.open());
    act(() => first.onclose());
    expect(FakeWebSocket.instances).toHaveLength(1);

    // Primer reintento: 1000ms
    act(() => vi.advanceTimersByTime(999));
    expect(FakeWebSocket.instances).toHaveLength(1);
    act(() => vi.advanceTimersByTime(1));
    expect(FakeWebSocket.instances).toHaveLength(2);

    const second = FakeWebSocket.instances[1];
    act(() => second.onclose());

    // Segundo reintento: 2000ms (2^1 * 1000)
    act(() => vi.advanceTimersByTime(1999));
    expect(FakeWebSocket.instances).toHaveLength(2);
    act(() => vi.advanceTimersByTime(1));
    expect(FakeWebSocket.instances).toHaveLength(3);
  });

  it("no se conecta si enabled=false, y send() devuelve false sin socket abierto", () => {
    const { result } = renderHook(() => useWebSocket("ws://test", { enabled: false }));
    expect(FakeWebSocket.instances).toHaveLength(0);

    let sent;
    act(() => {
      sent = result.current.send({ hello: "world" });
    });
    expect(sent).toBe(false);
  });

  it("send() escribe en el socket cuando está OPEN", () => {
    const { result } = renderHook(() => useWebSocket("ws://test"));
    const ws = FakeWebSocket.instances[0];
    act(() => ws.open());

    let sent;
    act(() => {
      sent = result.current.send({ hello: "world" });
    });

    expect(sent).toBe(true);
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ hello: "world" }));
  });
});
