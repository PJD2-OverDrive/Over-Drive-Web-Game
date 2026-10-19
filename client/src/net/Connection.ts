import type { ClientMessage, ServerMessage } from "@overdrive/shared";

export type ConnectionStatus = "connecting" | "open" | "closed";

export interface ConnectionHandlers {
  onMessage: (message: ServerMessage) => void;
  onStatus: (status: ConnectionStatus) => void;
}

const RECONNECT_DELAY_MS = 2000;

/**
 * Camada fina sobre o WebSocket nativo.
 * Responsabilidades: conectar, enviar/receber JSON e reconectar sozinho.
 */
export class Connection {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private disposed = false;

  constructor(
    private readonly url: string,
    private readonly playerName: string,
    private readonly handlers: ConnectionHandlers,
  ) {}

  connect(): void {
    if (this.disposed) return;

    this.handlers.onStatus("connecting");

    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.addEventListener("open", () => {
      this.handlers.onStatus("open");
      this.send({ type: "join", name: this.playerName });
    });

    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;

      try {
        this.handlers.onMessage(JSON.parse(event.data) as ServerMessage);
      } catch (error) {
        console.warn("Mensagem inválida recebida do servidor:", error);
      }
    });

    socket.addEventListener("close", () => {
      this.socket = null;
      this.handlers.onStatus("closed");
      this.scheduleReconnect();
    });

    socket.addEventListener("error", () => {
      socket.close();
    });
  }

  send(message: ClientMessage): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(message));
  }

  dispose(): void {
    this.disposed = true;

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.socket?.close();
    this.socket = null;
  }

  private scheduleReconnect(): void {
    if (this.disposed || this.reconnectTimer !== null) return;

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, RECONNECT_DELAY_MS);
  }
}
