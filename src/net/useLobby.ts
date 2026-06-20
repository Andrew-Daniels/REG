import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMsg, ServerMsg, PublicLobby } from './protocol';
import { WS_PORT } from './protocol';
import type { GameSettings } from '../state/settings';

function wsUrl(): string {
  const { protocol, hostname, host } = window.location;
  const wsProto = protocol === 'https:' ? 'wss:' : 'ws:';
  // In dev the client (5173) and lobby server (8787) are separate.
  if (import.meta.env.DEV) return `${wsProto}//${hostname}:${WS_PORT}`;
  return `${wsProto}//${host}`;
}

export interface LobbyClient {
  connected: boolean;
  lobby: PublicLobby | null;
  you: string | null;
  code: string | null;
  error: string | null;
  host(settings: GameSettings, name: string): void;
  join(code: string, name: string): void;
  start(): void;
  guess(g: number): void;
  next(): void;
}

const REJOIN_KEY = 'fairway.rejoin';

export function useLobby(): LobbyClient {
  const ws = useRef<WebSocket | null>(null);
  const queue = useRef<ClientMsg[]>([]);
  const [connected, setConnected] = useState(false);
  const [lobby, setLobby] = useState<PublicLobby | null>(null);
  const [you, setYou] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = new WebSocket(wsUrl());
    ws.current = socket;
    socket.onopen = () => {
      setConnected(true);
      queue.current.forEach((m) => socket.send(JSON.stringify(m)));
      queue.current = [];
    };
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setError('Connection problem — is the lobby server running?');
    socket.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as ServerMsg;
      switch (msg.t) {
        case 'hosted':
          setYou(msg.you); setCode(msg.code); setLobby(msg.lobby); break;
        case 'joined':
          setYou(msg.you); setCode(msg.lobby.code); setLobby(msg.lobby);
          sessionStorage.setItem(REJOIN_KEY, msg.you); break;
        case 'state':
          setLobby(msg.lobby); break;
        case 'error':
          setError(msg.message); break;
      }
    };
    return () => socket.close();
  }, []);

  const sendMsg = useCallback((m: ClientMsg) => {
    setError(null);
    const s = ws.current;
    if (s && s.readyState === WebSocket.OPEN) s.send(JSON.stringify(m));
    else queue.current.push(m);
  }, []);

  return {
    connected,
    lobby,
    you,
    code,
    error,
    host: (settings, name) => sendMsg({ t: 'host', settings, name }),
    join: (c, name) =>
      sendMsg({ t: 'join', code: c, name, rejoinId: sessionStorage.getItem(REJOIN_KEY) ?? undefined }),
    start: () => sendMsg({ t: 'start' }),
    guess: (g) => sendMsg({ t: 'guess', guess: g }),
    next: () => sendMsg({ t: 'next' }),
  };
}
