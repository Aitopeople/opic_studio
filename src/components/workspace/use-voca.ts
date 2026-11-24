"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  emptyVocaState,
  vocaStateSchema,
  type VocaState,
} from "@/lib/voca-quiz";
import type { VocaWord } from "@/lib/voca-words";

const visitProgress = new Map<string, string>();
const temporaryNotice =
  "이 브라우저에 진도를 저장할 수 없어 이번 방문에서만 연습합니다.";

function readProgress(raw: string | null) {
  return {
    raw,
    state: raw ? vocaStateSchema.parse(JSON.parse(raw)) : emptyVocaState,
  };
}

export function useVoca(userId?: string) {
  const key = `opic:voca:v1:${userId ?? "guest"}`;
  const [saved, setSaved] = useState<ReturnType<typeof readProgress> | null>(
    null,
  );
  const [personal, setPersonal] = useState<VocaWord[] | null>(
    userId ? null : [],
  );
  const [notice, setNotice] = useState("");
  const [volatile, setVolatile] = useState(false);
  const [sourceError, setSourceError] = useState(false);
  useEffect(() => {
    function load() {
      const temporary = visitProgress.get(key);
      if (temporary) {
        setVolatile(true);
        setNotice(temporaryNotice);
        setSaved(readProgress(temporary));
        return;
      }
      try {
        setSaved(readProgress(localStorage.getItem(key)));
      } catch {
        setSaved(readProgress(null));
        setVolatile(true);
        setNotice("저장된 진도를 읽을 수 없어 이번 방문에서만 연습합니다.");
      }
    }
    load();
    const sync = (event: StorageEvent) => {
      if (event.key === key || event.key === null) load();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key]);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    api<{ words: VocaWord[] }>("/api/voca")
      .then(({ words }) => {
        if (active) setPersonal(words);
      })
      .catch(() => {
        if (active) {
          setSourceError(true);
          setPersonal([]);
        }
      });
    return () => {
      active = false;
    };
  }, [userId]);

  async function change(update: (state: VocaState) => VocaState) {
    if (!saved) return false;
    function commit() {
      if (!saved) return false;
      const state = update(saved.state);
      if (state === saved.state) return true;
      const raw = JSON.stringify(state);
      try {
        if (!volatile) {
          const current = localStorage.getItem(key);
          if (current !== saved.raw) {
            setSaved(readProgress(current));
            setNotice(
              "다른 탭의 최신 진도를 불러왔어요. 현재 문항을 확인해 주세요.",
            );
            return false;
          }
          localStorage.setItem(key, raw);
          setNotice("");
        } else visitProgress.set(key, raw);
      } catch {
        setVolatile(true);
        visitProgress.set(key, raw);
        setNotice(temporaryNotice);
      }
      setSaved({ raw, state });
      return true;
    }
    if (navigator.locks && !volatile)
      return navigator.locks.request(key, commit);
    return commit();
  }

  return { state: saved?.state, personal, notice, sourceError, change };
}
