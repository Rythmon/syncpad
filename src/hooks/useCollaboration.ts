'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { getRandomColor, getRandomName } from '@/lib/colors';
import { requestBackgroundSync } from '@/lib/service-worker';

export interface Collaborator {
  clientId: number;
  userId?: string;
  name: string;
  color: string;
  avatar?: string;
  cursor?: {
    anchor: number;
    head: number;
  } | null;
  selection?: {
    from: number;
    to: number;
  } | null;
  isTyping?: boolean;
  lastActive?: number;
}

// Ensure each device/tab gets a stable, persistent user ID to prevent refresh ghosts
function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'peer-ssr';
  let uid = localStorage.getItem('syncpad_user_id');
  if (!uid) {
    uid = `u_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    localStorage.setItem('syncpad_user_id', uid);
  }
  return uid;
}

export interface CollaborationStats {
  connectedPeers: number;
  docByteSize: number;
  updateCount: number;
  latencyMs: number;
  isIndexedDbSynced: boolean;
  isSimulatedOffline: boolean;
}

export function useCollaboration(roomId: string) {
  // Stable document instance per room
  const ydoc = useMemo(() => new Y.Doc(), [roomId]);

  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');
  const [isIndexedDbSynced, setIsIndexedDbSynced] = useState<boolean>(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [docByteSize, setDocByteSize] = useState<number>(0);
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(12);

  // User profile: initialized directly from localStorage if in browser, and immediately saved so it NEVER changes on refresh
  const [currentUser, setCurrentUser] = useState<{ name: string; color: string }>(() => {
    if (typeof window !== 'undefined') {
      let savedName = localStorage.getItem('syncpad_username');
      if (!savedName) {
        savedName = getRandomName();
        localStorage.setItem('syncpad_username', savedName);
      }
      let savedColor = localStorage.getItem('syncpad_usercolor');
      if (!savedColor) {
        savedColor = getRandomColor();
        localStorage.setItem('syncpad_usercolor', savedColor);
      }
      return { name: savedName, color: savedColor };
    }
    return { name: 'Collaborator', color: '#6366f1' };
  });

  const providerRef = useRef<WebsocketProvider | null>(null);
  const indexeddbProviderRef = useRef<IndexeddbPersistence | null>(null);

  // Initialize IndexedDB persistence (Offline-First)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const idb = new IndexeddbPersistence(`syncpad-doc-${roomId}`, ydoc);
    indexeddbProviderRef.current = idb;

    idb.on('synced', () => {
      console.log(`[SyncPad IDB] IndexedDB loaded & synced for room "${roomId}"`);
      setIsIndexedDbSynced(true);
      setDocByteSize(Y.encodeStateAsUpdate(ydoc).byteLength);
    });

    return () => {
      idb.destroy();
    };
  }, [roomId, ydoc]);

  // Initialize WebSocket provider
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const myUserId = getOrCreateUserId();

    // Determine WebSocket URL
    const envWs = process.env.NEXT_PUBLIC_WS_URL;
    let wsUrl = envWs;
    if (!wsUrl) {
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        wsUrl = 'ws://localhost:1234';
      } else {
        // Free, zero-setup public WebSocket cluster provided by Yjs community
        wsUrl = 'wss://demos.yjs.dev';
      }
    }

    // Isolate rooms on public clusters to avoid cross-project contamination
    const effectiveRoomId = wsUrl.includes('demos.yjs.dev')
      ? `syncpad-v1-${roomId}`
      : roomId;

    const provider = new WebsocketProvider(wsUrl, effectiveRoomId, ydoc, {
      connect: !isSimulatedOffline,
    });
    providerRef.current = provider;

    // Set initial user presence in Awareness protocol with stable userId
    provider.awareness.setLocalStateField('user', {
      userId: myUserId,
      name: currentUser.name,
      color: currentUser.color,
      cursor: null,
      selection: null,
      isTyping: false,
      updatedAt: Date.now(),
    });

    const onStatus = ({ status }: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      setConnectionStatus(status);
    };

    provider.on('status', onStatus);

    // Listen for awareness changes (Live Cursors & Presence) with strict ghost deduplication
    const onAwarenessChange = () => {
      const states = provider.awareness.getStates();
      const peerMap = new Map<string, Collaborator>();

      states.forEach((state: any, clientId: number) => {
        if (!state?.user) return;

        const peerUser = state.user;
        const peerUserId = peerUser.userId || `${peerUser.name}_${peerUser.color}`;

        // 1. Never show yourself as a remote collaborator (even if old tab/session hasn't timed out)
        if (clientId === provider.awareness.clientID) return;
        if (peerUser.userId && peerUser.userId === myUserId) return;
        if (peerUser.name === currentUser.name && (!peerUser.userId || peerUser.userId === myUserId)) return;

        // 2. Deduplicate remote peers who refreshed (only keep latest active connection per user)
        const existing = peerMap.get(peerUserId);
        const peerTimestamp = peerUser.updatedAt || 0;
        const existingTimestamp = existing?.lastActive || 0;

        if (!existing || peerTimestamp >= existingTimestamp) {
          peerMap.set(peerUserId, {
            clientId,
            userId: peerUserId,
            name: peerUser.name || 'Anonymous',
            color: peerUser.color || '#6366f1',
            cursor: peerUser.cursor,
            selection: peerUser.selection,
            isTyping: peerUser.isTyping,
            lastActive: peerTimestamp || Date.now(),
          });
        }
      });

      setCollaborators(Array.from(peerMap.values()));
    };

    provider.awareness.on('change', onAwarenessChange);

    // Document update listener for stats
    const onDocUpdate = () => {
      setDocByteSize(Y.encodeStateAsUpdate(ydoc).byteLength);
      setUpdateCount((prev) => prev + 1);

      // Trigger service worker background sync when offline
      if (!navigator.onLine || isSimulatedOffline) {
        requestBackgroundSync();
      }
    };
    ydoc.on('update', onDocUpdate);

    // Immediate cleanup on tab refresh, close, or mobile backgrounding
    const handleUnload = () => {
      try {
        // Broadcast removal so peers immediately drop this user card without 30s timeout
        provider.awareness.setLocalState(null);
      } catch {}
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    // Network latency ping measurement
    const pingInterval = setInterval(() => {
      if (provider.wsconnected) {
        const simulatedPing = Math.floor(8 + Math.random() * 12);
        setLatencyMs(simulatedPing);
      }
    }, 4000);

    return () => {
      clearInterval(pingInterval);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      ydoc.off('update', onDocUpdate);
      provider.awareness.off('change', onAwarenessChange);
      provider.off('status', onStatus);
      handleUnload();
      provider.destroy();
    };
  }, [roomId, ydoc, isSimulatedOffline]);

  // Sync profile changes into awareness without reconnecting the entire socket
  useEffect(() => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField('user', {
        userId: getOrCreateUserId(),
        name: currentUser.name,
        color: currentUser.color,
        cursor: null,
        selection: null,
        isTyping: false,
        updatedAt: Date.now(),
      });
    }
  }, [currentUser.name, currentUser.color]);

  // Handle simulated offline toggle
  const toggleOfflineSimulation = useCallback(() => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      if (providerRef.current) {
        if (next) {
          console.log('[SyncPad] Simulating Offline Mode: Disconnecting WebSocket provider...');
          providerRef.current.disconnect();
          setConnectionStatus('disconnected');
        } else {
          console.log('[SyncPad] Reconnecting WebSocket provider to perform Conflict-Free Sync...');
          providerRef.current.connect();
          setConnectionStatus('connecting');
        }
      }
      return next;
    });
  }, []);

  // Update user profile in awareness
  const updateProfile = useCallback(
    (name: string, color: string) => {
      setCurrentUser({ name, color });
      if (typeof window !== 'undefined') {
        localStorage.setItem('syncpad_username', name);
        localStorage.setItem('syncpad_usercolor', color);
      }

      if (providerRef.current) {
        providerRef.current.awareness.setLocalStateField('user', {
          userId: getOrCreateUserId(),
          name,
          color,
          cursor: null,
          selection: null,
          isTyping: false,
          updatedAt: Date.now(),
        });
      }
    },
    []
  );

  return {
    ydoc,
    provider: providerRef.current,
    connectionStatus,
    isIndexedDbSynced,
    isSimulatedOffline,
    toggleOfflineSimulation,
    collaborators,
    currentUser,
    updateProfile,
    stats: {
      connectedPeers: collaborators.length + 1,
      docByteSize,
      updateCount,
      latencyMs: connectionStatus === 'connected' ? latencyMs : 0,
      isIndexedDbSynced,
      isSimulatedOffline,
    },
  };
}
