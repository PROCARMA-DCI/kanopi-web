"use client";

import { fetching } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  KanopiCreateChatResponse,
  KanopiThreadDetail,
  KanopiThreadMessage,
  KanopiThreadResponse,
} from "../data/messages";
import { MessageAttachment } from "../MessageAttachment";
import type { MessagesSession } from "../messagesSession";

const POLL_INTERVAL_MS = 30_000;

interface ThreadScreenProps {
  /** null = brand-new, unsaved chat — the first message sent creates it. */
  threadId: string | null;
  /** Who is chatting, about which policy — saved by "File Claim". */
  session: MessagesSession;
  /** Mobile only: the list and thread are separate views there. */
  onBack: () => void;
  /** Lets the parent learn the real id once the first message creates it. */
  onThreadCreated?: (threadId: string) => void;
}

/**
 * One conversation — the right pane of the /messages page (MessagesPage
 * lays it out next to MessagesScreen). Header and composer stay fixed, only
 * the message list scrolls. The back arrow is mobile-only: on desktop the
 * list is always visible beside this pane.
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
  session,
  onBack,
  onThreadCreated,
}: ThreadScreenProps) {
  const { contract, customerInfo, customerId } = session;

  const [localThreadId, setLocalThreadId] = useState(threadId);
  const [thread, setThread] = useState<KanopiThreadDetail | null>(null);
  const [messages, setMessages] = useState<KanopiThreadMessage[]>([]);
  const [loading, setLoading] = useState(!!threadId);
  const [loadError, setLoadError] = useState("");
  const [sendError, setSendError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  // Optional file sent as `attach` (null = no file).
  const [attach, setAttach] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local preview URL for a picked image, so it can be viewed before sending.
  const attachPreview = useMemo(
    () =>
      attach?.type.startsWith("image/") ? URL.createObjectURL(attach) : null,
    [attach],
  );
  useEffect(() => {
    return () => {
      if (attachPreview) URL.revokeObjectURL(attachPreview);
    };
  }, [attachPreview]);
  const listRef = useRef<HTMLDivElement>(null);

  const clearAttach = () => {
    setAttach(null);
    // Reset the native input too, or re-picking the same file won't fire onChange.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
    setDraft("");
    clearAttach();
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
          contract_id: contract.contract_id ?? "",
          user_id: customerInfo?.UserID ?? "",
          customer_id: customerInfo?.CustomerID ?? "",
          message: text,
          attach,
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
      clearAttach();
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
        attach,
      },
    });
    setSending(false);
    if (!res.ok || !res.data) {
      setSendError("Couldn't send your message — please try again.");
      return;
    }
    setMessages((prev) => [...prev, res.data as KanopiThreadMessage]);
    setDraft("");
    clearAttach();
  };

  const title =
    thread?.user1Name || (localThreadId ? "Conversation" : "New Conversation");

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[#7b8466]/25 px-3 py-3 sm:px-5 sm:py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-[20px] text-[#2d3d00] hover:bg-[#f1fad0] lg:hidden"
        >
          ←
        </button>
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#a6e00c] bg-[#e9f4cf] text-[15px] font-bold text-[#2d3d00]">
          {thread?.User1Image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thread.User1Image}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            title.charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-[#2d3d00] sm:text-[17px]">
            {title}
          </p>
          <p className="truncate text-[12px] text-[#7d8760]">
            {contract.title}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#fffdfa] p-4 sm:p-6"
      >
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

        {!loading && !loadError && !localThreadId && messages.length === 0 && (
          <p className="mt-8 text-center text-[14px] text-[#7d8760]">
            Send your first message to start this conversation.
          </p>
        )}

        {!loading &&
          !loadError &&
          messages.map((m) => {
            const isMine = customerId
              ? String(m.user1) === String(customerId)
              : m.device_type === "mobile";
            return (
              <div
                key={m.message_id}
                className={cn("flex", isMine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-[14px] sm:text-[15px]",
                    isMine
                      ? "rounded-br-md bg-[#a6e00c] text-[#2d3d00]"
                      : "rounded-bl-md border border-[#7b8466]/30 bg-white text-[#2d3d00]",
                  )}
                >
                  {m.upload_img && (
                    <MessageAttachment url={m.upload_img} mine={isMine} />
                  )}
                  <p className="whitespace-pre-wrap break-words">
                    {m.message}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[11px]",
                      isMine ? "text-[#2d3d00]/60" : "text-[#7d8760]",
                    )}
                  >
                    {m.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[#7b8466]/25 p-3 sm:p-4">
        {sendError && (
          <p className="mb-2 text-center text-[13px] text-red-600">
            {sendError}
          </p>
        )}
        {attach && (
          <div className="mb-2 flex w-fit max-w-full items-center gap-2 rounded-full border border-[#7b8466]/40 bg-white px-3 py-1 text-[12px] text-[#2d3d00]">
            {attachPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attachPreview}
                alt=""
                className="size-8 rounded object-cover"
              />
            ) : (
              <span aria-hidden>📎</span>
            )}
            <span className="truncate">{attach.name}</span>
            {attachPreview && (
              <a
                href={attachPreview}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 font-semibold underline underline-offset-2"
              >
                View image
              </a>
            )}
            <button
              type="button"
              onClick={clearAttach}
              aria-label="Remove attachment"
              className="cursor-pointer text-[#7b8466] hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={(e) => setAttach(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach a file"
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#7b8466]/40 bg-white text-[18px] hover:bg-[#f1fad0] sm:size-12"
          >
            📎
          </button>
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
            className="h-11 flex-1 rounded-xl border border-input bg-background px-4 text-[14px] text-foreground outline-none focus:border-primary sm:h-12"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="h-11 cursor-pointer rounded-xl bg-[#a6e00c] px-5 text-[14px] font-bold text-[#2d3d00] disabled:cursor-not-allowed disabled:opacity-50 sm:h-12"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
