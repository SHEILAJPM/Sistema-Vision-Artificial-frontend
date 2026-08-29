import { Component } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "./ui/Button.jsx";

// Red de seguridad para errores de render que ningun try/catch de evento
// puede atrapar (props inesperadas, un payload de WS que rompe un .map,
// etc.). Sin esto, cualquier throw en el arbol deja la pantalla en blanco --
// grave en un dashboard que controla banda/luz/servo en vivo.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary atrapó un error de render:", error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta-500 text-white">
          <TriangleAlert size={20} strokeWidth={2} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ink">Algo salió mal en el dashboard</p>
          <p className="text-xs text-ink-faint max-w-sm">
            La sesión de control sigue activa en el backend; esto solo afectó la pantalla.
            Recargá para reintentar.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={this.handleReload}>
          Recargar
        </Button>
      </div>
    );
  }
}
