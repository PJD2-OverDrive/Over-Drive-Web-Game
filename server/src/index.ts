import {
  SNAPSHOT_RATE,
  SERVER_PORT,
  TICK_MS,
  TICK_RATE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  WS_PATH,
  type ClientMessage,
  type InputState,
  type ServerMessage,
} from "@overdrive/shared";
import { GameRoom } from "./room";

const ARENA_CHANNEL = "arena";
const SNAPSHOT_EVERY = Math.max(1, Math.round(TICK_RATE / SNAPSHOT_RATE));

const room = new GameRoom();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isInputState(value: unknown): value is InputState {
  if (!isRecord(value)) return false;
  return (
    typeof value.up === "boolean" &&
    typeof value.down === "boolean" &&
    typeof value.left === "boolean" &&
    typeof value.right === "boolean"
  );
}

/**
 * Nunca confie no que chega pela rede: valida tudo antes de usar.
 */
function parseMessage(raw: string | Buffer): ClientMessage | null {
  let value: unknown;
  try {
    const text = typeof raw === "string" ? raw : raw.toString("utf8");
    value = JSON.parse(text);
  } catch {
    return null;
  }

  if (!isRecord(value) || typeof value.type !== "string") return null;

  switch (value.type) {
    case "join":
      return { type: "join", name: typeof value.name === "string" ? value.name : "Jogador" };
    case "input":
      return isInputState(value.input) ? { type: "input", input: value.input } : null;
    case "ping":
      return { type: "ping", time: typeof value.time === "number" ? value.time : 0 };
    default:
      return null;
  }
}

const server = Bun.serve<{ playerId: string | null }>({
  port: SERVER_PORT,

  fetch(request, bunServer) {
    const url = new URL(request.url);

    if (url.pathname === WS_PATH) {
      const upgraded = bunServer.upgrade(request, { data: { playerId: null } });
      if (!upgraded) return new Response("Falha no upgrade para WebSocket", { status: 400 });
      return undefined;
    }

    if (url.pathname === "/health") {
      return Response.json({ ok: true, players: room.players.size, tick: room.tick });
    }

    return new Response(`Over Drive server no ar. WebSocket em ${WS_PATH}`, {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },

  websocket: {
    open() {
      // O jogador só entra de verdade quando envia a mensagem "join".
    },

    message(ws, raw) {
      const message = parseMessage(raw);
      if (!message) return;

      if (message.type === "join") {
        if (ws.data.playerId) return; // já entrou

        const player = room.addPlayer(message.name);
        ws.data.playerId = player.id;
        ws.subscribe(ARENA_CHANNEL);

        const welcome: ServerMessage = {
          type: "welcome",
          id: player.id,
          tickRate: TICK_RATE,
          snapshotRate: SNAPSHOT_RATE,
          world: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
        };
        ws.send(JSON.stringify(welcome));
        console.log(`+ ${player.name} entrou (${room.players.size} online)`);
        return;
      }

      if (!ws.data.playerId) return;

      if (message.type === "input") {
        room.setInput(ws.data.playerId, message.input);
      } else if (message.type === "ping") {
        const pong: ServerMessage = { type: "pong", time: message.time };
        ws.send(JSON.stringify(pong));
      }
    },

    close(ws) {
      if (!ws.data.playerId) return;

      const player = room.players.get(ws.data.playerId);
      room.removePlayer(ws.data.playerId);
      console.log(`- ${player?.name ?? "Jogador"} saiu (${room.players.size} online)`);
    },
  },
});

// Loop autoritativo: avança a simulação e periodicamente publica o estado.
const DELTA_SECONDS = TICK_MS / 1000;

setInterval(() => {
  room.update(DELTA_SECONDS);

  if (room.tick % SNAPSHOT_EVERY !== 0) return;

  const snapshot: ServerMessage = {
    type: "snapshot",
    tick: room.tick,
    players: room.snapshot(),
  };
  server.publish(ARENA_CHANNEL, JSON.stringify(snapshot));
}, TICK_MS);

console.log(`Servidor ouvindo em ws://localhost:${server.port}${WS_PATH}`);
