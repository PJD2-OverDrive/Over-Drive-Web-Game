import { Game } from "./engine/Game";
import { Connection, type ConnectionStatus } from "./net/Connection";

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  connecting: "conectando…",
  open: "conectado",
  closed: "reconectando…",
};

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error('Elemento <canvas id="game"> não encontrado.');

const statusEl = document.querySelector<HTMLSpanElement>("#status");

const game = new Game(canvas);

const NAME_KEY = "overdrive:player-name";
const playerName =
  localStorage.getItem(NAME_KEY) ?? `Jogador ${Math.floor(Math.random() * 900 + 100)}`;
localStorage.setItem(NAME_KEY, playerName);

const wsProtocol = location.protocol === "https:" ? "wss" : "ws";
const serverUrl =
  import.meta.env.VITE_SERVER_URL ?? `${wsProtocol}://${location.hostname}:3001/ws`;

const connection = new Connection(serverUrl, playerName, {
  onStatus(status) {
    if (!statusEl) return;
    statusEl.textContent = STATUS_LABELS[status];
    statusEl.dataset.state = status;
  },

  onMessage(message) {
    switch (message.type) {
      case "welcome":
        game.setLocalPlayer(message.id);
        game.setWorld(message.world);
        break;
      case "snapshot":
        game.pushSnapshot(message.players);
        break;
      case "error":
        console.warn("Servidor:", message.message);
        break;
      case "pong":
        break;
    }
  },
});

game.onInput = (input) => connection.send({ type: "input", input });

connection.connect();
