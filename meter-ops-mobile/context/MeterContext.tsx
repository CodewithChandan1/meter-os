import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { demoUser, initialMeters, Meter, MeterHistoryEvent, MeterStatus, teamMembers } from '@/lib/meter-data';
import { ChatMessage, initialMessages } from '@/lib/chat-data';
import { getApiBaseUrl, getWebSocketUrl, fetchWithTimeout } from '@/lib/api-config';

export type WorkspaceDetails = {
  name: string;
  inventoryType: string;
  region: string;
  regionType: string;
  storageMode: string;
  storageDescription: string;
};

export const defaultWorkspaceDetails: WorkspaceDetails = {
  name: 'North Punjab',
  inventoryType: 'Meter inventory workspace',
  region: 'Jalandhar, Punjab',
  regionType: 'Default field region',
  storageMode: 'Local-first storage',
  storageDescription: 'Changes are saved on this device',
};

type User = typeof demoUser;
type MeterContextValue = {
  meters: Meter[];
  user: User | null;
  users: User[];
  workspaceDetails: WorkspaceDetails;
  updateWorkspaceDetails: (updates: Partial<WorkspaceDetails>) => void;
  isHydrated: boolean;
  stats: { total: number; available: number; assigned: number; installed: number; pending: number; cancelled: number };
  signIn: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  addMeter: (input: Omit<Meter, 'id' | 'history'>) => void;
  updateMeter: (id: string, updates: Partial<Omit<Meter, 'id' | 'history'>>) => void;
  deleteMeter: (id: string) => void;
  assignMeter: (id: string, memberName: string, signature: boolean) => void;
  acceptAssignment: (id: string) => void;
  rejectAssignment: (id: string) => void;
  installMeter: (id: string, notes: string) => void;
  requestReturn: (id: string, reason?: string) => void;
  acceptReturn: (id: string) => void;
  rejectReturn: (id: string) => void;
  returnMeter: (id: string, reason?: string) => void;
  cancelMeter: (id: string, reason: string) => void;
  getMeter: (id: string) => Meter | undefined;
  messages: ChatMessage[];
  sendMessage: (receiverName: string, text: string, meterId?: string) => void;
  updateUser: (updates: Partial<User>) => void;
};

const STORAGE_KEY = 'meterops-local-state-v4';
const MeterContext = createContext<MeterContextValue | null>(null);

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const today = () => '11 Aug 2026 · 03:42 PM';

function addHistory(meter: Meter, event: Omit<MeterHistoryEvent, 'id' | 'date'>): Meter {
  return { ...meter, history: [{ ...event, id: makeId(), date: today() }, ...meter.history] };
}

function syncMeterToBackend(meter: Meter) {
  const baseUrl = getApiBaseUrl();
  fetch(`${baseUrl}/meters/${meter.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meter),
  }).catch(() => null);
}

export function MeterProvider({ children }: { children: ReactNode }) {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [workspaceDetails, setWorkspaceDetails] = useState<WorkspaceDetails>(defaultWorkspaceDetails);
  const [users, setUsers] = useState<User[]>([]);
  const [isHydrated, setHydrated] = useState(false);

  const updateWorkspaceDetails = (updates: Partial<WorkspaceDetails>) => {
    setWorkspaceDetails((prev) => {
      const updated = { ...prev, ...updates };
      const baseUrl = getApiBaseUrl();
      fetch(`${baseUrl}/workspace`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => null);
      return updated;
    });
  };

  // Fetch Live Meters, Users, Messages & Workspace Details from Neon Postgres API Server
  useEffect(() => {
    const fetchLiveData = async () => {
      const baseUrl = getApiBaseUrl();
      try {
        const [metersRes, usersRes, msgsRes, wsRes] = await Promise.all([
          fetch(`${baseUrl}/meters`),
          fetch(`${baseUrl}/users`),
          fetch(`${baseUrl}/messages`),
          fetch(`${baseUrl}/workspace`),
        ]);
        const metersData = await metersRes.json();
        if (metersData.success && Array.isArray(metersData.meters)) {
          setMeters(metersData.meters);
        }
        const usersData = await usersRes.json();
        if (usersData.success && Array.isArray(usersData.users)) {
          setUsers(usersData.users);
        }
        const msgsData = await msgsRes.json();
        if (msgsData.success && Array.isArray(msgsData.messages) && msgsData.messages.length > 0) {
          setMessages(msgsData.messages);
        }
        const wsData = await wsRes.json();
        if (wsData.success && wsData.workspace) {
          setWorkspaceDetails(wsData.workspace);
        }
      } catch (e) {
        // network fallback
      }
    };

    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) {
        try {
          const saved = JSON.parse(value) as { meters: Meter[]; user: User | null; workspaceDetails?: WorkspaceDetails };
          if (saved.meters && saved.meters.length > 0) {
            setMeters(saved.meters);
          }
          if (saved.workspaceDetails) {
            setWorkspaceDetails(saved.workspaceDetails);
          }
          if (saved.user) {
            setUser(saved.user);
            // Re-sync saved user profile from Neon Postgres database
            const baseUrl = getApiBaseUrl();
            fetch(`${baseUrl}/auth/user?email=${encodeURIComponent(saved.user.email)}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success && data.user) {
                  setUser(data.user);
                }
              })
              .catch(() => null);
          }
        } catch {
          // ignore error
        }
      }
      setHydrated(true);
      fetchLiveData();
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ meters, user, workspaceDetails })).catch(() => undefined);
  }, [meters, user, workspaceDetails, isHydrated]);

  const visibleMeters = useMemo(() => {
    if (!user) return [];
    return meters.filter(
      (meter) =>
        meter.status === 'AVAILABLE' ||
        !meter.assignedTo ||
        meter.assignedTo === user.name ||
        meter.assignedBy === user.name
    );
  }, [meters, user]);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Connect to Backend WebSocket Server on Port 5001
  useEffect(() => {
    let socket: WebSocket | null = null;
    try {
      const wsUrl = getWebSocketUrl();
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[WebSocket] Realtime Chat Connected to Port 5001');
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_CHAT_MESSAGE') {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.message.id)) return prev;
              return [...prev, payload.message];
            });
          }
        } catch (e) {
          // ignore non-json
        }
      };

      socket.onerror = () => {
        console.log('[WebSocket] Live server offline');
      };

      setWs(socket);
    } catch (e) {
      // fallback
    }

    return () => {
      if (socket) socket.close();
    };
  }, []);

  const sendMessage = (receiverName: string, text: string, meterId?: string) => {
    if (!text.trim()) return;
    const newMsg: ChatMessage = {
      id: makeId(),
      senderName: user?.name ?? 'You',
      receiverName,
      text: text.trim(),
      timestamp: 'Just now',
      meterId,
    };

    setMessages((prev) => [...prev, newMsg]);

    // Save chat message to Neon Postgres
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg),
    }).catch(() => null);

    // Broadcast over WebSocket if connected
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'NEW_CHAT_MESSAGE',
          message: newMsg,
        })
      );
    }
  };

  const dynamicTeamMembers = useMemo(() => {
    if (users.length > 0) {
      return users.map((u, i) => {
        const name = u.name || u.email.split('@')[0];
        const initials = name.split(/[._\s]+/).map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
        const colorsList: ('navy' | 'amber' | 'mint' | 'plum')[] = ['navy', 'amber', 'mint', 'plum'];
        return {
          id: u.id,
          name,
          initials,
          role: u.role || 'Field Specialist',
          assigned: meters.filter((m) => m.assignedTo === name && m.status !== 'INSTALLED' && m.status !== 'CANCELLED').length,
          color: colorsList[i % colorsList.length],
          online: true,
        };
      });
    }
    return teamMembers;
  }, [users, meters]);

  const value = useMemo<MeterContextValue>(() => {
    const stats = {
      total: visibleMeters.length,
      available: visibleMeters.filter((meter) => meter.status === 'AVAILABLE').length,
      assigned: visibleMeters.filter((meter) => meter.status === 'ASSIGNED').length,
      installed: visibleMeters.filter((meter) => meter.status === 'INSTALLED').length,
      pending: visibleMeters.filter((meter) => meter.status === 'INSTALLATION_PENDING' || meter.status === 'ASSIGNMENT_PENDING' || meter.status === 'RETURN_PENDING').length,
      cancelled: visibleMeters.filter((meter) => meter.status === 'CANCELLED').length,
    };

    return {
      meters: visibleMeters,
      user,
      isHydrated,
      stats,
      signIn: async (email: string, password: string, name?: string) => {
        const baseUrl = getApiBaseUrl();
        const res = await fetchWithTimeout(`${baseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), name: name?.trim() }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          setUser(data.user);
          await AsyncStorage.setItem('email', data.user.email);
          await AsyncStorage.setItem('last_email', data.user.email);
          return;
        }
        throw new Error(data.message || 'Authentication failed. Please verify credentials.');
      },
      signOut: async () => {
        if (user?.email) {
          await AsyncStorage.setItem('last_email', user.email);
        }
        setUser(null);
        await AsyncStorage.removeItem(STORAGE_KEY);
      },
      updateUser: (updates) => {
        setUser((prev) => {
          if (!prev) return null;
          const updated = { ...prev, ...updates };
          if (updated.id) {
            const baseUrl = getApiBaseUrl();
            fetch(`${baseUrl}/users/${updated.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            }).catch(() => null);
          }
          return updated;
        });
      },
      addMeter: (input) => {
        const newMeter: Meter = {
          ...input,
          id: `meter-${Date.now()}`,
          assignedTo: user?.name,
          assignedBy: user?.name,
          history: [
            {
              id: makeId(),
              action: 'Meter created',
              detail: 'Added to workspace inventory',
              by: user?.name ?? 'You',
              date: today(),
              icon: 'plus',
              tone: 'navy',
            },
          ],
        };

        const baseUrl = getApiBaseUrl();
        fetch(`${baseUrl}/meters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMeter),
        }).catch(() => null);

        setMeters((current) => [newMeter, ...current]);
      },
      updateMeter: (id, updates) => {
        setMeters((current) =>
          current.map((meter) => {
            if (meter.id !== id) return meter;
            const updated = addHistory(
              { ...meter, ...updates },
              {
                action: 'Meter details updated',
                detail: 'Updated customer, contact or map location',
                by: user?.name ?? 'You',
                icon: 'edit-3',
                tone: 'navy',
              }
            );
            syncMeterToBackend(updated);
            return updated;
          })
        );
      },
      assignMeter: (id, memberName, signature) => {
        setMeters((current) => current.map((meter) => {
          if (meter.id !== id) return meter;
          const status: MeterStatus = signature ? 'ASSIGNED' : 'ASSIGNMENT_PENDING';
          const updated = addHistory(
            { ...meter, status, assignedTo: memberName, assignedBy: user?.name ?? 'You' },
            {
              action: signature ? `Assigned to ${memberName}` : `Assignment requested to ${memberName}`,
              detail: signature ? 'Signature captured from receiver on spot' : 'Awaiting acceptance/signature by receiver',
              by: user?.name ?? 'You',
              icon: signature ? 'check-circle' : 'arrow-up-right',
              tone: signature ? 'mint' : 'amber',
            },
          );
          syncMeterToBackend(updated);
          return updated;
        }));
      },
      acceptAssignment: (id) => {
        setMeters((current) => current.map((meter) => {
          if (meter.id !== id) return meter;
          const updated = addHistory(
            { ...meter, status: 'ASSIGNED' },
            {
              action: 'Assignment accepted',
              detail: `Handover accepted by ${user?.name}`,
              by: user?.name ?? 'You',
              icon: 'check-circle',
              tone: 'mint',
            },
          );
          syncMeterToBackend(updated);
          return updated;
        }));
      },
      rejectAssignment: (id) => {
        setMeters((current) => current.map((meter) => {
          if (meter.id !== id) return meter;
          const assigner = meter.assignedBy;
          const updated = addHistory(
            { ...meter, status: 'AVAILABLE', assignedTo: assigner, assignedBy: undefined },
            {
              action: 'Assignment declined',
              detail: `Handover declined by ${user?.name}. Returned to ${assigner || 'stock'}.`,
              by: user?.name ?? 'You',
              icon: 'x-circle',
              tone: 'red',
            },
          );
          syncMeterToBackend(updated);
          return updated;
        }));
      },
      installMeter: (id, notes) => {
        setMeters((current) => current.map((meter) => {
          if (meter.id !== id) return meter;
          const updated = addHistory(
            { ...meter, status: 'INSTALLED', installationDate: '11 Aug 2026', notes: notes || meter.notes, assignedTo: meter.assignedTo ?? user?.name },
            { action: 'Installation completed', detail: notes || 'Meter installed at customer location', by: user?.name ?? 'You', icon: 'check-circle', tone: 'mint' },
          );
          syncMeterToBackend(updated);
          return updated;
        }));
      },
      requestReturn: (id, reason) => {
        setMeters((current) => current.map((meter) => {
          if (meter.id !== id) return meter;
          const updated = addHistory(
            { ...meter, status: 'RETURN_PENDING' },
            {
              action: 'Return requested',
              detail: reason ? `Return initiated (${reason})` : `Return initiated by ${user?.name}`,
              by: user?.name ?? 'You',
              icon: 'rotate-ccw',
              tone: 'amber',
            },
          );
          syncMeterToBackend(updated);
          return updated;
        }));
      },
      acceptReturn: (id) => {
        setMeters((current) => current.map((meter) => {
          if (meter.id !== id) return meter;
          const previousAssignee = meter.assignedTo;
          const updated = addHistory(
            { ...meter, status: 'RETURNED', assignedTo: meter.assignedBy ?? user?.name },
            {
              action: 'Return accepted into stock',
              detail: `Returned meter received & verified from ${previousAssignee || 'field'}`,
              by: user?.name ?? 'You',
              icon: 'rotate-ccw',
              tone: 'mint',
            },
          );
          syncMeterToBackend(updated);
          return updated;
        }));
      },
      rejectReturn: (id) => {
        setMeters((current) => current.map((meter) => {
          if (meter.id !== id) return meter;
          const updated = addHistory(
            { ...meter, status: 'ASSIGNED' },
            {
              action: 'Return request rejected',
              detail: `Return request declined by ${user?.name}. Kept with assignee.`,
              by: user?.name ?? 'You',
              icon: 'x-circle',
              tone: 'red',
            },
          );
          syncMeterToBackend(updated);
          return updated;
        }));
      },
      returnMeter: (id, reason) => {
        setMeters((current) => current.map((meter) => {
          if (meter.id !== id) return meter;
          const previousAssignee = meter.assignedTo;
          const updated = addHistory(
            { ...meter, status: 'RETURNED', assignedTo: user?.name, assignedBy: user?.name },
            {
              action: 'Returned to stock',
              detail: reason ? `Returned by ${previousAssignee} (${reason})` : `Returned to stock from ${previousAssignee || 'field'}`,
              by: user?.name ?? 'You',
              icon: 'rotate-ccw',
              tone: 'amber',
            },
          );
          syncMeterToBackend(updated);
          return updated;
        }));
      },
      cancelMeter: (id, reason) => {
        setMeters((current) => current.map((meter) => {
          if (meter.id !== id) return meter;
          const updated = addHistory(
            { ...meter, status: 'CANCELLED', notes: meter.notes, cancellationReason: reason },
            { action: 'Meter cancelled', detail: reason, by: user?.name ?? 'You', icon: 'x-circle', tone: 'red' },
          );
          syncMeterToBackend(updated);
          return updated;
        }));
      },
      deleteMeter: (id) => {
        setMeters((current) => current.filter((meter) => meter.id !== id));
        const baseUrl = getApiBaseUrl();
        fetch(`${baseUrl}/meters/${id}`, {
          method: 'DELETE',
        }).catch(() => null);
      },
      getMeter: (id) => meters.find((m) => m.id === id),
      messages,
      sendMessage,
      workspaceDetails,
      updateWorkspaceDetails,
      users,
    };
  }, [meters, visibleMeters, user, users, isHydrated, messages, workspaceDetails]);

  return <MeterContext.Provider value={value}>{children}</MeterContext.Provider>;
}

export function useMeters() {
  const context = useContext(MeterContext);
  if (!context) throw new Error('useMeters must be used within MeterProvider');
  return context;
}

export { teamMembers };