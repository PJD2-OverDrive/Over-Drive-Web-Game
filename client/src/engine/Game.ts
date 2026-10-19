import {
  PLAYER_RADIUS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  clamp,
  lerp,
  type InputState,
  type PlayerState,
  type WorldSize,
} from "@overdrive/shared";
import { Input } from "./Input";

interface BufferedSnapshot {
  receivedAt: number;
  players: PlayerState[];
}

const INTERPOLATION_DELAY_MS = 100;
const MAX_BUFFERED_SNAPSHOTS = 20;
const GRID_SIZE = 80;

/**
 * Loop e renderização do jogo no canvas.
 *
 * Importante: o client NÃO decide posições. Ele guarda os snapshots que o
 * servidor manda e interpola entre eles para a animação ficar suave.
 */
export class Game {
  onInput: ((input: InputState) => void) | null = null;

  private readonly ctx: CanvasRenderingContext2D;
  private readonly input: Input;
  private readonly snapshots: BufferedSnapshot[] = [];

  private localId: string | null = null;
  private world: WorldSize = { width: WORLD_WIDTH, height: WORLD_HEIGHT };
  private dpr = 1;
  private cssWidth = 0;
  private cssHeight = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Este navegador não suporta Canvas 2D.");
    this.ctx = ctx;

    this.input = new Input();
    this.input.onChange((state) => this.onInput?.(state));

    window.addEventListener("resize", this.resize);
    this.resize();
    requestAnimationFrame(this.frame);
  }

  setLocalPlayer(id: string): void {
    this.localId = id;
  }

  setWorld(world: WorldSize): void {
    this.world = { ...world };
  }

  pushSnapshot(players: PlayerState[]): void {
    this.snapshots.push({ receivedAt: performance.now(), players });
    if (this.snapshots.length > MAX_BUFFERED_SNAPSHOTS) this.snapshots.shift();
  }

  dispose(): void {
    window.removeEventListener("resize", this.resize);
    this.input.dispose();
    this.snapshots.length = 0;
  }

  private resize = (): void => {
    this.dpr = window.devicePixelRatio || 1;
    this.cssWidth = window.innerWidth;
    this.cssHeight = window.innerHeight;

    this.canvas.width = Math.floor(this.cssWidth * this.dpr);
    this.canvas.height = Math.floor(this.cssHeight * this.dpr);
    this.canvas.style.width = `${this.cssWidth}px`;
    this.canvas.style.height = `${this.cssHeight}px`;
  };

  private frame = (now: number): void => {
    this.render(now);
    requestAnimationFrame(this.frame);
  };

  private render(now: number): void {
    const ctx = this.ctx;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);

    // Escala o mundo mantendo a proporção e centraliza na tela.
    const scale = Math.min(
      this.cssWidth / this.world.width,
      this.cssHeight / this.world.height,
    );
    const offsetX = (this.cssWidth - this.world.width * scale) / 2;
    const offsetY = (this.cssHeight - this.world.height * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    this.drawArena(ctx);
    for (const player of this.samplePlayers(now)) {
      this.drawPlayer(ctx, player);
    }

    ctx.restore();
  }

  private drawArena(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.world;

    ctx.fillStyle = "#0a0f1c";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(88, 166, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = GRID_SIZE; x < width; x += GRID_SIZE) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = GRID_SIZE; y < height; y += GRID_SIZE) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(88, 166, 255, 0.35)";
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState): void {
    const isLocal = player.id === this.localId;

    ctx.save();
    if (isLocal) {
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 24;
    }
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 3;
    ctx.strokeStyle = isLocal ? "#ffffff" : "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.font = "600 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(
      isLocal ? `${player.name} (você)` : player.name,
      player.x,
      player.y - PLAYER_RADIUS - 8,
    );
  }

  /**
   * Escolhe dois snapshots e interpola entre eles. O pequeno atraso
   * (100 ms) é o que permite animar mesmo recebendo só 15 snapshots/s.
   */
  private samplePlayers(now: number): PlayerState[] {
    const snapshots = this.snapshots;
    if (snapshots.length === 0) return [];

    const first = snapshots[0]!;
    const latest = snapshots[snapshots.length - 1]!;
    if (snapshots.length === 1) return latest.players;

    const targetTime = now - INTERPOLATION_DELAY_MS;
    if (targetTime <= first.receivedAt) return first.players;

    let previous = latest;
    let next = latest;

    for (let i = 0; i < snapshots.length - 1; i += 1) {
      const a = snapshots[i]!;
      const b = snapshots[i + 1]!;

      if (targetTime >= a.receivedAt && targetTime <= b.receivedAt) {
        previous = a;
        next = b;
        break;
      }

      if (targetTime > b.receivedAt) {
        previous = b;
        next = b;
      }
    }

    const span = next.receivedAt - previous.receivedAt;
    const alpha = span <= 0 ? 1 : clamp((targetTime - previous.receivedAt) / span, 0, 1);
    const previousById = new Map(previous.players.map((player) => [player.id, player]));

    return next.players.map((player) => {
      const before = previousById.get(player.id);
      if (!before) return player;

      return {
        ...player,
        x: lerp(before.x, player.x, alpha),
        y: lerp(before.y, player.y, alpha),
      };
    });
  }
}
