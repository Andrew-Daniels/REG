import { useEffect, useRef } from 'react';
import { useLobby } from '../net/useLobby';
import { LiveParty } from './LiveParty';
import type { GameSettings } from '../state/settings';

export type LiveIntent =
  | { type: 'host'; settings: GameSettings }
  | { type: 'join'; code: string; name: string };

/** Owns the WebSocket connection and fires the host/join intent once. */
export function LiveContainer({ intent, onExit }: { intent: LiveIntent; onExit: () => void }) {
  const client = useLobby();
  const fired = useRef(false);

  useEffect(() => {
    if (!client.connected || fired.current) return;
    fired.current = true;
    if (intent.type === 'host') client.host(intent.settings, 'Host');
    else client.join(intent.code, intent.name);
  }, [client.connected]);

  return <LiveParty client={client} onExit={onExit} />;
}
