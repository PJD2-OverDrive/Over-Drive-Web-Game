import {
  MAX_NAME_LENGTH,
  PLAYER_COLORS,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  clamp,
  type InputState,
  type PlayerState,
} from "@overdrive/shared";

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  input: InputState;
}

const EMPTY_INPUT: InputState = { up: false, down: false, left: false, right: false };

/**
 * Estado autoritativo do jogo. Só o servidor altera posições.
 * O client apenas envia intenções (input) e desenha o que recebe.
 */
export class GameRoom {
  readonly players = new Map<string, Player>();
  tick = 0;

  addPlayer(rawName: string): Player {
    const id = crypto.randomUUID();
    const name = rawName.trim().slice(0, MAX_NAME_LENGTH) || "Jogador";
    const color = PLAYER_COLORS[this.players.size % PLAYER_COLORS.length] ?? "#ffffff";

    const player: Player = {
      id,
      name,
      color,
      x: WORLD_WIDTH / 2 + (Math.random() - 0.5) * 200,
      y: WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 200,
      input: { ...EMPTY_INPUT },
    };

    this.players.set(id, player);
    return player;
  }

  removePlayer(id: string): void {
    this.players.delete(id);
  }

  setInput(id: string, input: InputState): void {
    const player = this.players.get(id);
    if (player) player.input = input;
  }

  update(deltaSeconds: number): void {
    this.tick += 1;

    for (const player of this.players.values()) {
      const dx = Number(player.input.right) - Number(player.input.left);
      const dy = Number(player.input.down) - Number(player.input.up);
      if (dx === 0 && dy === 0) continue;

      // Normaliza para a diagonal não ser mais rápida que o eixo.
      const length = Math.hypot(dx, dy);
      player.x = clamp(
        player.x + (dx / length) * PLAYER_SPEED * deltaSeconds,
        PLAYER_RADIUS,
        WORLD_WIDTH - PLAYER_RADIUS,
      );
      player.y = clamp(
        player.y + (dy / length) * PLAYER_SPEED * deltaSeconds,
        PLAYER_RADIUS,
        WORLD_HEIGHT - PLAYER_RADIUS,
      );
    }
  }

  snapshot(): PlayerState[] {
    return [...this.players.values()].map(({ id, name, x, y, color }) => ({
      id,
      name,
      x,
      y,
      color,
    }));
  }
}
