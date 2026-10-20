# Over Drive — jogo web

Monorepo com três sistemas independentes:

```
client/   → roda no navegador: Phaser (canvas, cenas, input, renderização)
shared/   → contrato comum: tipos de mensagem, constantes do mundo, matemática
server/   → roda no Bun: estado autoritativo, loop de simulação, broadcast
```

O `client` e o `server` **nunca** importam código um do outro. Os dois importam
`@overdrive/shared`. Assim o protocolo fica em um lugar só e o TypeScript acusa
erro nos dois lados quando algo muda.

## Estrutura de pastas

```
root/
├── client/                     # o que vai ser mostrado ao cliente
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts             # configuração, cena e texto "Hello World"
│       └── style.css
├── shared/                     # arquivos compartilhados entre client e server
│   └── src/
│       ├── protocol.ts         # ClientMessage / ServerMessage
│       ├── constants.ts        # ticks, tamanho do mundo, velocidades
│       └── math.ts
└── server/                     # back-end
    └── src/
        ├── index.ts            # Bun.serve + WebSocket + loop
        └── room.ts             # estado autoritativo do jogo
```

Stack: **TypeScript**, **Bun** (workspaces, servidor), **Vite** (client) e
**Phaser** (engine do jogo).

## Como rodar

```bash
bun install
bun run dev
```

- Client: http://localhost:5173
- Server: ws://localhost:3001/ws (health check em http://localhost:3001/health)

Comandos separados:

```bash
bun run dev:client
bun run dev:server
bun run typecheck
bun run build
```

O client atual é um template vazio em Phaser que exibe apenas "Hello World"
centralizado em Arial. O `server` e o `shared` continuam disponíveis para
quando o jogo for implementado.

## Como os três sistemas conversam

```
 teclado
    │
    ▼
 client  ── ClientMessage ──►  server
    ▲                            │
    └──── ServerMessage ─────────┘
```

1. O client abre o WebSocket e envia `{ type: "join", name }`.
2. O server cria o jogador e responde com `welcome` (id + tamanho do mundo).
3. Quando uma tecla muda, o client envia `{ type: "input", input }`.
4. O server aplica o movimento no loop de 30 Hz (fonte da verdade).
5. A cada 2 ticks o server publica um `snapshot` com todos os jogadores.
6. O client interpola entre os snapshots e desenha.

## O que colocar em cada lugar

| Vou criar... | Onde |
| --- | --- |
| Uma mensagem nova entre client e server | `shared/src/protocol.ts` |
| Uma regra/constante do jogo (velocidade, tamanho, tick) | `shared/src/constants.ts` |
| Movimento, colisão, dano, pontuação | `server/src/room.ts` |
| Entrada de dados novos do jogador | `client/src/engine/Input.ts` |
| Desenho, câmera, efeitos, cenas | `client/src/main.ts` |
| Boot e configuração do Phaser | `client/src/main.ts` |

## Próximos passos naturais

- Salas com código de convite (um `Map` de `GameRoom` no server).
- Client-side prediction para o jogador local responder sem atraso.
- `bun run build` gera `client/dist`, que pode ser servido por qualquer host estático.
- Em produção, defina `VITE_SERVER_URL=wss://seu-servidor/ws` antes do build.
