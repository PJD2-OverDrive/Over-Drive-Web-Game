/**
 * Contrato de comunicação entre client e server.
 *
 * Regra de ouro: tudo que atravessa a rede é descrito aqui.
 * O client e o server nunca importam código um do outro, apenas este pacote.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface WorldSize {
  width: number;
  height: number;
}

/** Estado de entrada do jogador (teclas pressionadas). */
export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

/** Estado de um jogador em um snapshot enviado pelo servidor. */
export interface PlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

/* ------------------------------- client -> server ------------------------------- */

export type ClientMessage =
  | { type: "join"; name: string }
  | { type: "input"; input: InputState }
  | { type: "ping"; time: number };

/* ------------------------------- server -> client ------------------------------- */

export type ServerMessage =
  | {
      type: "welcome";
      id: string;
      tickRate: number;
      snapshotRate: number;
      world: WorldSize;
    }
  | { type: "snapshot"; tick: number; players: PlayerState[] }
  | { type: "pong"; time: number }
  | { type: "error"; message: string };
