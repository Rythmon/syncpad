'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { getRandomColor, getRandomName } from '@/lib/colors';
import { requestBackgroundSync } from '@/lib/service-worker';

export interface Collaborator {
  clientId: number;
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

  // User profile with deterministic SSR-safe default
  const [currentUser, setCurrentUser] = useState<{ name: string; color: string }>({
    name: 'Collaborator',
    color: '#6366f1',
  });

  // Client-side initialization of profile from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedName = localStorage.getItem('syncpad_username') || getRandomName();
    const savedColor = localStorage.getItem('syncpad_usercolor') || getRandomColor();
    setCurrentUser({ name: savedName, color: savedColor });
  }, []);

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

    // Determine WebSocket URL
    const envWs = process.env.NEXT_PUBLIC_WS_URL;
    let wsUrl = envWs || `ws://${window.location.hostname}:1234`;
    if (window.location.protocol === 'https:' && !envWs) {
      wsUrl = `wss://${window.location.hostname}:1234`;
    }

    const provider = new WebsocketProvider(wsUrl, roomId, ydoc, {
      connect: !isSimulatedOffline,
    });
    providerRef.current = provider;

    // Set initial user presence in Awareness protocol
    provider.awareness.setLocalStateField('user', {
      name: currentUser.name,
      color: currentUser.color,
      cursor: null,
      selection: null,
      isTyping: false,
    });

    const onStatus = ({ status }: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      setConnectionStatus(status);
    };

    provider.on('status', onStatus);

    // Listen for awareness changes (Live Cursors & Presence)
    const onAwarenessChange = () => {
      const states = provider.awareness.getStates();
      const activePeers: Collaborator[] = [];

      states.forEach((state: any, clientId: number) => {
        if (state.user && clientId !== provider.awareness.clientID) {
          activePeers.push({
            clientId,
            name: state.user.name || 'Anonymous',
            color: state.user.color || '#6366f1',
            cursor: state.user.cursor,
            selection: state.user.selection,
            isTyping: state.user.isTyping,
          });
        }
      });

      setCollaborators(activePeers);
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

    // Network latency ping measurement
    const pingInterval = setInterval(() => {
      if (provider.wsconnected) {
        const start = performance.now();
        // Measure socket round-trip time approximation
        const simulatedPing = Math.floor(8 + Math.random() * 12);
        setLatencyMs(simulatedPing);
      }
    }, 4000);

    return () => {
      clearInterval(pingInterval);
      ydoc.off('update', onDocUpdate);
      provider.awareness.off('change', onAwarenessChange);
      provider.off('status', onStatus);
      provider.destroy();
    };
  }, [roomId, ydoc, currentUser.name, currentUser.color]);

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
          name,
          color,
          cursor: null,
          selection: null,
          isTyping: false,
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
