import type { Session } from '../types';

const STORAGE_KEY = 'suivi-sport-sessions';

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: Session[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function addSession(session: Session): void {
  const sessions = loadSessions();
  sessions.unshift(session);
  saveSessions(sessions);
}

export function updateSession(updated: Session): void {
  const sessions = loadSessions();
  const idx = sessions.findIndex(s => s.id === updated.id);
  if (idx !== -1) {
    sessions[idx] = updated;
    saveSessions(sessions);
  }
}

export function deleteSession(id: string): void {
  const sessions = loadSessions().filter(s => s.id !== id);
  saveSessions(sessions);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
