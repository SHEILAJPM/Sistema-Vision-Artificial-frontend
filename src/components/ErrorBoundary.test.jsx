import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary.jsx";

function Bomb() {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  it("renderiza los hijos normalmente cuando no hay error", () => {
    render(
      <ErrorBoundary>
        <p>contenido normal</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("contenido normal")).toBeInTheDocument();
  });

  it("atrapa un error de render y muestra el fallback en vez de una pantalla en blanco", () => {
    // React loguea el error a consola además de propagarlo al boundary;
    // se silencia solo para no ensuciar la salida del test.
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByText("Algo salió mal en el dashboard")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recargar" })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
