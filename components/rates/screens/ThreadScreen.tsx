"use client";

import { fetching } from "@/lib/api/client";
import { useEffect, useRef, useState } from "react";
import type {
  KanopiCreateChatResponse,
  KanopiThreadDetail,
  KanopiThreadMessage,
  KanopiThreadResponse,
} from "../data/messages";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";
import type {
  dashboardCustomerInfo,
  KanopiLoginData,
  PurchasedPlan,
} from "./LoginScreen";

const POLL_INTERVAL_MS = 30_000;

interface ThreadScreenProps {
  /** null = brand-new, unsaved chat — the first message sent creates it. */
  threadId: string | null;
  onBack: () => void;
  /** Lets the parent learn the real id once the first message creates it. */
  onThreadCreated?: (threadId: string) => void;
}

/**
 * One conversation (Figma 2901:1143, mobile — same no-desktop-mock caveat
 * as MessagesScreen). Same ScreenShell as every other screen in this
 * flow — onBack is ScreenShell's own standard Back button, wired back to
 * the thread list.
 *
 * Two modes, both driven by `threadId`:
 *  - existing thread (threadId set): fetches POST /kanopiThread on mount,
 *    re-fetches every 30s while open, sends via POST /kanopiSendMessage.
 *  - new/unsaved chat (threadId null): nothing to fetch/poll yet — the
 *    FIRST message the user sends creates the thread via POST
 *    /kanopiMessage instead, whose response already includes that first
 *    message back, after which this screen behaves exactly like an
 *    existing thread (polling starts, later messages use
 *    /kanopiSendMessage).
 */
export function ThreadScreen({
  threadId,
  onBack,
  onThreadCreated,
}: ThreadScreenProps) {
  const flow = useFlow();

  const loginData = flow.data.loginData as KanopiLoginData | undefined;
  const customerId = loginData?.CustomerInfo?.CustomerID;
  // The policy card whose "File Claim" button opened Messages/this thread.
  const contract = flow.data.contract as PurchasedPlan | undefined;
  const customerInfo = flow.data.CustomerInfo as
    | dashboardCustomerInfo
    | undefined;

  const [localThreadId, setLocalThreadId] = useState(threadId);
  const [thread, setThread] = useState<KanopiThreadDetail | null>(null);
  const [messages, setMessages] = useState<KanopiThreadMessage[]>([]);
  const [loading, setLoading] = useState(!!threadId);
  const [loadError, setLoadError] = useState("");
  const [sendError, setSendError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // A different thread was opened from the list (or a fresh "New Chat")
  // — reset everything to match.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalThreadId(threadId);
    setThread(null);
    setMessages([]);
    setLoading(!!threadId);
    setLoadError("");
    setSendError("");
  }, [threadId]);

  const loadThread = async (id: string, showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    const res = await fetching<KanopiThreadResponse>({
      url: "/api/kanopiThread",
      method: "POST",
      isFormdata: true,
      body: { threadid: id },
    });
    if (showSpinner) setLoading(false);
    if (!res.ok || !Array.isArray(res.messages)) {
      if (showSpinner) setLoadError("Couldn't load this conversation.");
      return;
    }
    setLoadError("");
    const rawThread = res.thread as KanopiThreadDetail | undefined;
    setThread(rawThread ?? null);
    setMessages(res.messages);
  };

  useEffect(() => {
    if (!localThreadId) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadThread(localThreadId, true);

    const interval = setInterval(() => {
      if (active) loadThread(localThreadId, false);
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [localThreadId]);

  // Keep the view scrolled to the latest message on load / new messages.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError("");

    if (!localThreadId) {
      // Nothing to reply to yet — this policy's first-ever message
      // creates the thread.
      const res = await fetching<KanopiCreateChatResponse>({
        url: "/api/kanopiMessage",
        method: "POST",
        isFormdata: true,
        body: {
          contract_id: contract?.contract_id ?? "",
          user_id: customerInfo?.UserID ?? "",
          customer_id: customerInfo?.CustomerID ?? "",
          message: text,
        },
      });
      setSending(false);
      if (!res.ok || res.success !== 1 || !res.threadid) {
        setSendError("Couldn't send your message — please try again.");
        return;
      }
      const newId = String(res.threadid);
      // kanopi_threads' own fields line up with KanopiThreadMessage except
      // message_id/threadid come back as strings here — cast the numeric
      // ones so the message renders immediately instead of waiting on the
      // next poll.
      const rawInitialMessages = (res.kanopi_threads ??
        []) as KanopiCreateChatResponse["kanopi_threads"];
      const initialMessages: KanopiThreadMessage[] = rawInitialMessages.map(
        (m) => ({
          ...m,
          message_id: Number(m.message_id),
          threadid: Number(m.threadid),
        }),
      );
      setMessages(initialMessages);
      setDraft("");
      setLocalThreadId(newId);
      onThreadCreated?.(newId);
      return;
    }

    // The raw response's own "data" key IS the sent message object, so
    // fetching<KanopiThreadMessage>()'s generic binds directly to that —
    // res.data is already the right shape, no extra unwrapping needed.
    const res = await fetching<KanopiThreadMessage>({
      url: "/api/kanopiSendMessage",
      method: "POST",
      isFormdata: true,
      body: {
        threadid: localThreadId,
        user_id: customerInfo?.UserID ?? "",
        message: text,
      },
    });
    setSending(false);
    if (!res.ok || !res.data) {
      setSendError("Couldn't send your message — please try again.");
      return;
    }
    setMessages((prev) => [...prev, res.data as KanopiThreadMessage]);
    setDraft("");
  };

  return (
    <ScreenShell
      id="yes-account-thread"
      index={0}
      total={1}
      completion={1}
      title={
        thread?.user1Name ||
        (localThreadId ? "Conversation" : "New Conversation")
      }
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

        {!loading && loadError && (
          <p className="mt-8 text-center text-[14px] text-red-600">
            {loadError}
          </p>
        )}

        {!loading && !loadError && (
          <>
            {!localThreadId && messages.length === 0 && (
              <p className="mt-8 text-center text-[14px] text-[#7d8760]">
                Send your first message to start this conversation.
              </p>
            )}

            {messages.length > 0 && (
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
            )}

            {sendError && (
              <p className="mt-3 text-center text-[13px] text-red-600">
                {sendError}
              </p>
            )}

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
