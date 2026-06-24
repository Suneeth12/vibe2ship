// hooks/useOfflineDraft.ts
import { useState, useEffect } from 'react';

export interface DraftIssue {
  id: string;
  description: string;
  latitude: number;
  longitude: number;
  mediaType: string;
  imageBase64: string; // base64 payload stored offline
  createdAt: string;
}

const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useOfflineDrafts() {
  const [drafts, setDrafts] = useState<DraftIssue[]>([]);

  const loadDrafts = () => {
    const list: DraftIssue[] = [];
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('draft_')) {
        try {
          const entry = JSON.parse(localStorage.getItem(key)!);
          if (Date.now() - entry.savedAt > DRAFT_TTL_MS) {
            keysToRemove.push(key);
          } else {
            list.push(entry.data);
          }
        } catch (e) {
          console.error('Failed to parse draft:', e);
        }
      }
    }

    // Purge expired
    keysToRemove.forEach(k => localStorage.removeItem(k));
    setDrafts(list);
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const saveDraft = (draft: DraftIssue) => {
    const entry = {
      data: draft,
      savedAt: Date.now(),
    };
    localStorage.setItem(`draft_${draft.id}`, JSON.stringify(entry));
    loadDrafts();
  };

  const deleteDraft = (id: string) => {
    localStorage.removeItem(`draft_${id}`);
    loadDrafts();
  };

  const clearAllDrafts = () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('draft_')) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
    loadDrafts();
  };

  return {
    drafts,
    saveDraft,
    deleteDraft,
    clearAllDrafts,
    refreshDrafts: loadDrafts,
  };
}
