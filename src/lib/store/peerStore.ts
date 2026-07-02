import { writable } from "svelte/store";
import type { GameState } from "$lib/game/types";

type PeerStatus = "disconnected" | "connecting" | "connected" | "error";

interface PeerState {
  status: PeerStatus;
  guestCount: number;
  error: string | null;
}

const _store = writable<PeerState>({
  status: "disconnected",
  guestCount: 0,
  error: null,
});

let peer: import("peerjs").Peer | null = null;
let connections: import("peerjs").DataConnection[] = [];
let onStateReceived: ((state: GameState) => void) | null = null;

function roomIdFromGameId(gameId: string): string {
  return "sk-" + gameId.replace(/-/g, "").slice(0, 6).toUpperCase();
}

export const peerStore = {
  subscribe: _store.subscribe,

  async startAsHost(gameId: string): Promise<string> {
    if (peer) {
      peer.destroy();
      peer = null;
      connections = [];
    }
    const { Peer } = await import("peerjs");
    const roomId = roomIdFromGameId(gameId);
    peer = new Peer(roomId);
    _store.update((s) => ({ ...s, status: "connecting" }));

    return new Promise((resolve, reject) => {
      peer!.on("open", () => {
        _store.update((s) => ({ ...s, status: "connected" }));
        resolve(roomId);
      });
      peer!.on("connection", (conn) => {
        connections.push(conn);
        _store.update((s) => ({ ...s, guestCount: connections.length }));
        conn.on("close", () => {
          connections = connections.filter((c) => c !== conn);
          _store.update((s) => ({ ...s, guestCount: connections.length }));
        });
        conn.on("error", () => {
          connections = connections.filter((c) => c !== conn);
          _store.update((s) => ({ ...s, guestCount: connections.length }));
        });
      });
      peer!.on("error", (err) => {
        _store.update((s) => ({ ...s, status: "error", error: String(err) }));
        reject(err);
      });
    });
  },

  async joinAsGuest(
    roomId: string,
    onState: (state: GameState) => void,
  ): Promise<void> {
    if (peer) {
      peer.destroy();
      peer = null;
    }
    const { Peer } = await import("peerjs");
    onStateReceived = onState;
    peer = new Peer();
    _store.update((s) => ({ ...s, status: "connecting" }));

    return new Promise((resolve, reject) => {
      peer!.on("open", () => {
        const conn = peer!.connect(roomId);
        conn.on("open", () => {
          _store.update((s) => ({ ...s, status: "connected" }));
          resolve();
        });
        conn.on("data", (data) => {
          if (onStateReceived) onStateReceived(data as GameState);
        });
        conn.on("close", () => {
          _store.update((s) => ({ ...s, status: "disconnected" }));
        });
      });
      peer!.on("error", (err) => {
        _store.update((s) => ({ ...s, status: "error", error: String(err) }));
        reject(err);
      });
    });
  },

  broadcastState(state: GameState) {
    for (const conn of connections) {
      if (conn.open) conn.send(state);
    }
  },

  disconnect() {
    peer?.destroy();
    peer = null;
    connections = [];
    onStateReceived = null;
    _store.set({ status: "disconnected", guestCount: 0, error: null });
  },
};
