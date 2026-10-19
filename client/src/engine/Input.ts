import type { InputState } from "@overdrive/shared";

const KEY_MAP: Record<string, keyof InputState> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

/**
 * Lê o teclado e avisa apenas quando o estado muda,
 * evitando mandar mensagens repetidas para o servidor.
 */
export class Input {
  private readonly state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  private readonly listeners = new Set<(state: InputState) => void>();

  constructor() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.reset);
  }

  onChange(listener: (state: InputState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.reset);
    this.listeners.clear();
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const direction = KEY_MAP[event.code];
    if (!direction) return;

    event.preventDefault();
    if (event.repeat || this.state[direction]) return;

    this.state[direction] = true;
    this.emit();
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    const direction = KEY_MAP[event.code];
    if (!direction) return;

    event.preventDefault();
    if (!this.state[direction]) return;

    this.state[direction] = false;
    this.emit();
  };

  private reset = (): void => {
    this.state.up = false;
    this.state.down = false;
    this.state.left = false;
    this.state.right = false;
    this.emit();
  };

  private emit(): void {
    const snapshot = { ...this.state };
    for (const listener of this.listeners) listener(snapshot);
  }
}
