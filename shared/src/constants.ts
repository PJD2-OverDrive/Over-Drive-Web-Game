/** Atualizações da simulação por segundo (no servidor). */
export const TICK_RATE = 30;

/** Duração de um tick em milissegundos. */
export const TICK_MS = 1000 / TICK_RATE;

/** Quantos snapshots o servidor envia por segundo. */
export const SNAPSHOT_RATE = 15;

/** Tamanho lógico do mundo do jogo (o client escala para caber na tela). */
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

export const PLAYER_RADIUS = 18;

/** Velocidade do jogador em unidades por segundo. */
export const PLAYER_SPEED = 320;

export const MAX_NAME_LENGTH = 16;

export const SERVER_PORT = 3001;
export const WS_PATH = "/ws";

export const PLAYER_COLORS = [
  "#ff4d6d",
  "#4dd4ff",
  "#ffd166",
  "#7cff6b",
  "#c084fc",
  "#ff9f43",
];
