/**
 * Live phone-lobby server: WebSocket game host + static file server.
 *
 * Free to operate — a single small Node process. In production it serves the
 * built client from /dist and handles the lobby protocol on the same port.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  type Lobby,
  makeCode,
  createLobby,
  addMember,
  removeMember,
  startGame,
  lobbyGuess,
  lobbyNext,
} from './lobby';
import { chooseProvider } from '../src/data';
import type { ClientMsg, ServerMsg, PublicLobby } from '../src/net/protocol';
import { WS_PORT } from '../src/net/protocol';

const provider = chooseProvider();
const PORT = Number(process.env.PORT) || WS_PORT;
const DIST = join(fileURLToPath(new URL('../dist', import.meta.url)));

interface Conn {
  ws: WebSocket;
  id: string;
  code?: string;
}

const lobbies = new Map<string, Lobby>();
const conns = new Set<Conn>();
let idCounter = 0;

function uid(prefix: string): string {
  return `${prefix}${(++idCounter).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Hide the answer: strip the current listing's price + guess amounts until reveal. */
function sanitize(lobby: Lobby): PublicLobby {
  let game = lobby.game;
  if (game && game.phase === 'guessing') {
    const cur = game.currentRound;
    game = {
      ...game,
      rounds: game.rounds.map((r, i) =>
        i === cur
          ? {
              ...r,
              listing: { ...r.listing, price: -1 },
              // Reveal only *who* has guessed, not the amounts.
              guesses: r.guesses.map((g) => ({ playerId: g.playerId, guess: -1 })),
            }
          : r,
      ),
    };
  }
  return {
    code: lobby.code,
    hostId: lobby.hostId,
    settings: lobby.settings,
    members: lobby.members,
    phase: lobby.phase,
    game,
  };
}

function send(ws: WebSocket, msg: ServerMsg) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(code: string) {
  const lobby = lobbies.get(code);
  if (!lobby) return;
  const payload: ServerMsg = { t: 'state', lobby: sanitize(lobby) };
  for (const c of conns) {
    if (c.code === code) send(c.ws, payload);
  }
}

async function handle(conn: Conn, msg: ClientMsg) {
  switch (msg.t) {
    case 'host': {
      let code = makeCode(4);
      while (lobbies.has(code)) code = makeCode(4);
      const lobby = createLobby(code, conn.id, msg.settings);
      lobbies.set(code, lobby);
      conn.code = code;
      send(conn.ws, { t: 'hosted', code, you: conn.id, lobby: sanitize(lobby) });
      break;
    }
    case 'join': {
      const code = msg.code.toUpperCase();
      const lobby = lobbies.get(code);
      if (!lobby) return send(conn.ws, { t: 'error', message: 'No lobby with that code' });
      const playerId = msg.rejoinId ?? conn.id;
      try {
        lobbies.set(code, addMember(lobby, playerId, msg.name));
        conn.code = code;
        conn.id = playerId;
        send(conn.ws, { t: 'joined', you: playerId, lobby: sanitize(lobbies.get(code)!) });
        broadcast(code);
      } catch (e) {
        send(conn.ws, { t: 'error', message: (e as Error).message });
      }
      break;
    }
    case 'start': {
      const code = conn.code;
      const lobby = code ? lobbies.get(code) : undefined;
      if (!lobby || lobby.hostId !== conn.id) return;
      const listings = await provider.fetchListings({
        statuses: lobby.settings.statuses,
        recencyDays: lobby.settings.recencyDays,
      });
      try {
        lobbies.set(code!, startGame(lobby, listings.length ? listings : await provider.fetchListings({ statuses: ['closed', 'active', 'pending'] })));
        broadcast(code!);
      } catch (e) {
        send(conn.ws, { t: 'error', message: (e as Error).message });
      }
      break;
    }
    case 'guess': {
      const code = conn.code;
      const lobby = code ? lobbies.get(code) : undefined;
      if (!lobby) return;
      lobbies.set(code!, lobbyGuess(lobby, conn.id, msg.guess));
      broadcast(code!);
      break;
    }
    case 'next': {
      const code = conn.code;
      const lobby = code ? lobbies.get(code) : undefined;
      if (!lobby || lobby.hostId !== conn.id) return;
      lobbies.set(code!, lobbyNext(lobby));
      broadcast(code!);
      break;
    }
  }
}

const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    const url = (req.url || '/').split('?')[0];
    let filePath = join(DIST, normalize(url === '/' ? '/index.html' : url));
    if (!filePath.startsWith(DIST)) filePath = join(DIST, 'index.html');
    let body: Buffer;
    try {
      body = await readFile(filePath);
    } catch {
      body = await readFile(join(DIST, 'index.html')); // SPA fallback
      filePath = 'index.html';
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'text/plain' });
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end('error');
  }
});

const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  const conn: Conn = { ws, id: uid('u') };
  conns.add(conn);
  ws.on('message', (raw) => {
    let msg: ClientMsg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    void handle(conn, msg);
  });
  ws.on('close', () => {
    conns.delete(conn);
    if (conn.code) {
      const lobby = lobbies.get(conn.code);
      // Only drop players from an open lobby; keep them mid-game for reconnects.
      if (lobby && lobby.phase === 'lobby') {
        lobbies.set(conn.code, removeMember(lobby, conn.id));
        broadcast(conn.code);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🏡⛳ Price Is Fairway lobby server on :${PORT}`);
});
