"use client";

import { useEffect, useRef, useState } from "react";
import { fetching } from "@/lib/api/client";
import type {
  KanopiThreadDetail,
  KanopiThreadMessage,
  KanopiThreadResponse,
} from "../data/messages";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";
import type { KanopiLoginData } from "./LoginScreen";

const POLL_INTERVAL_MS = 30_000;

interface ThreadScreenProps {
  threadId: string;
  onBack: () => void;
}

/**
 * One conversation (Figma 2901:1143, mobile — same no-desktop-mock caveat
 * as MessagesScreen). Same ScreenShell as every other screen in this
 * flow — onBack is ScreenShell's own standard Back button, wired back to
 * the thread list. Fetches /kanopiThread on mount, then re-fetches every
 * 30s on a plain setInterval while this screen stays open — cleared on
 * unmount.
 */
export function ThreadScreen({ threadId, onBack }: ThreadScreenProps) {
  const flow = useFlow();

  const loginData = flow.data.loginData as KanopiLoginData | undefined;
  const customerId = loginData?.CustomerInfo?.CustomerID;

  const [thread, setThread] = useState<KanopiThreadDetail | null>(null);
  const [messages, setMessages] = useState<KanopiThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const loadThread = async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    const res = await fetching<KanopiThreadResponse>({
      url: "/api/kanopiThread",
      method: "POST",
      isFormdata: true,
      body: { threadid: threadId },
    });
    if (showSpinner) setLoading(false);
    if (!res.ok || !Array.isArray(res.messages)) {
      if (showSpinner) setError("Couldn't load this conversation.");
      return;
    }
    setError("");
    const rawThread = res.thread as KanopiThreadDetail | undefined;
    setThread(rawThread ?? null);
    setMessages(res.messages);
  };

  useEffect(() => {
    let active = true;
    loadThread(true);

    const interval = setInterval(() => {
      if (active) loadThread(false);
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // Keep the view scrolled to the latest message on load / new messages.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    // The raw response's own "data" key IS the sent message object, so
    // fetching<KanopiThreadMessage>()'s generic binds directly to that —
    // res.data is already the right shape, no extra unwrapping needed.
    const res = await fetching<KanopiThreadMessage>({
      url: "/api/kanopiSendMessage",
      method: "POST",
      isFormdata: true,
      body: { threadid: threadId, message: text },
    });
    setSending(false);
    if (!res.ok || !res.data) return;
    setMessages((prev) => [...prev, res.data as KanopiThreadMessage]);
    setDraft("");
  };

  return (
    <ScreenShell
      id="yes-account-thread"
      index={0}
      total={1}
      completion={1}
      title={thread?.user1Name || "Conversation"}
      canAdvance
      onBack={onBack}
      contentClassName="max-w-3xl"
    >
      <div className="flex flex-1 flex-col">
        {loading && (
          <p className="mt-8 text-center text-[14px] text-[#7d8760]">
            Loading conversation…
          </p>
        )}

        {!loading && error && (
          <p className="mt-8 text-center text-[14px] text-red-600">{error}</p>
        )}

        {!loading && !error && (
          <>
            <div
              ref={listRef}
              className="max-h-[50vh] flex-1 space-y-3 overflow-y-auto rounded-2xl border-[1.5px] border-[#7b8466] bg-[#fff9f5] p-4 sm:p-6"
            >
              {messages.map((m) => {
                const isMine = customerId
                  ? String(m.user1) === String(customerId)
                  : m.device_type === "mobile";
                return (
                  <div
                    key={m.message_id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-[14px] sm:text-[15px] ${
                        isMine
                          ? "bg-[#a6e00c] text-[#2d3d00]"
                          : "border border-[#7b8466]/40 bg-white text-[#2d3d00]"
                      }`}
                    >
                      <p>{m.message}</p>
                      <p
                        className={`mt-1 text-[11px] ${isMine ? "text-[#2d3d00]/60" : "text-[#7d8760]"}`}
                      >
                        {m.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex gap-3">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message…"
                className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-[14px] text-foreground outline-none focus:border-primary sm:h-13 sm:text-[15px]"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || sending}
                className="h-12 cursor-pointer rounded-xl bg-[#a6e00c] px-5 text-[14px] font-bold text-[#2d3d00] disabled:cursor-not-allowed disabled:opacity-50 sm:h-13 sm:text-[15px]"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </ScreenShell>
  );
}
