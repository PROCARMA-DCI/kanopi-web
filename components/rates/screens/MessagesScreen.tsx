"use client";

import { fetching } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { ACCOUNT } from "../data/account";
import type {
  KanopiMessageListResponse,
  KanopiThreadSummary,
} from "../data/messages";
import type { PurchasedPlan } from "./LoginScreen";

interface MessagesScreenProps {
  /** The policy whose claim threads are listed. */
  contract: PurchasedPlan;
  /** Highlighted row — the thread currently open on the right. */
  activeThreadId: string | null;
  /** Change to re-fetch the list (e.g. after a new chat is created). */
  reloadKey?: number;
  onOpenThread: (threadId: string) => void;
  onStartNewChat: () => void;
}

type Tab = "all" | "active" | "resolved";
const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "resolved", label: "Resolved" },
];

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("active")) return "bg-[#a6e00c] text-[#2d3d00]";
  if (s.includes("resolved")) return "bg-[#e9f4cf] text-[#5c6b3a]";
  return "bg-[#eee] text-[#7b8466]";
}

/**
 * Thread list — the left pane of the /messages page (MessagesPage lays it
 * out next to ThreadScreen). It only fills the pane it's given: header,
 * search and tabs stay fixed, the list scrolls, "New Chat" is pinned at the
 * bottom.
 *
 * POST /kanopiThreads' `success` flag tells the two empty cases apart —
 * success 1 with threads is a real list; success 0 (or an empty list) is
 * NOT an error, it just means this policy has no claim thread yet, so a
 * "New Chat" prompt shows instead.
 */
export function MessagesScreen({
  contract,
  activeThreadId,
  reloadKey = 0,
  onOpenThread,
  onStartNewChat,
}: MessagesScreenProps) {
  const [threads, setThreads] = useState<KanopiThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  // Fetch on mount, when the policy changes, and whenever the parent bumps
  // reloadKey. Only the very first load shows the spinner — later reloads
  // refresh the rows quietly so the list doesn't flash.
  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetching<KanopiMessageListResponse>({
        url: "/api/kanopiThreads",
        method: "POST",
        isFormdata: true,
        body: { contractid: contract.contract_id ?? "" },
      });
      if (!active) return;
      setLoading(false);
      if (!res.ok) {
        setError("Couldn't load your messages — please try again.");
        return;
      }
      setError("");
      setThreads(
        res.success === 1 && Array.isArray(res.threads) ? res.threads : [],
      );
    })();
    return () => {
      active = false;
    };
  }, [contract.contract_id, reloadKey]);

  const unreadTotal = threads.reduce((sum, t) => sum + t.unread_count, 0);

  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      const status = t.status.toLowerCase();
      if (tab === "active" && !status.includes("active")) return false;
      if (
        tab === "resolved" &&
        !status.includes("resolved") &&
        !status.includes("closed")
      )
        return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        t.last_replied_by.name.toLowerCase().includes(q) ||
        t.last_message?.message?.toLowerCase().includes(q)
      );
    });
  }, [threads, tab, query]);

  const hasAnyThreads = threads.length > 0;
  const hasVisibleThreads = filteredThreads.length > 0;

  const newChatButton = (
    <button
      type="button"
      onClick={onStartNewChat}
      className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#a6e00c] px-5 text-[14px] font-bold text-[#2d3d00] shadow-[0px_4px_14px_rgba(129,74,0,0.25)] transition-shadow hover:shadow-[0px_6px_18px_rgba(166,224,12,0.4)]"
    >
      <span className="text-[17px] leading-none">+</span> New Chat
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Fixed top: title, active plan, search, tabs */}
      <div className="shrink-0 border-b border-[#7b8466]/25 p-4 sm:p-5">
        <h1 className="text-[20px] font-bold text-[#2d3d00] sm:text-[24px]">
          Messages
        </h1>
        <p className="mt-0.5 text-[13px] text-[#7d8760]">
          {unreadTotal > 0
            ? `${unreadTotal} unread conversation${unreadTotal === 1 ? "" : "s"}`
            : "All caught up"}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#7b8466]/50 bg-white/60 px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-[11px] text-[#7b8466]">Active Plan</p>
            <p className="truncate text-[13px] font-semibold text-[#2d3d00]">
              {contract.title ?? ACCOUNT.planName}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#a6e00c] px-2.5 py-0.5 text-[11px] font-bold text-[#2d3d00]">
            Active
          </span>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations…"
          disabled={!hasAnyThreads}
          className={cn(
            "mt-3 h-10 w-full rounded-xl border border-input bg-background px-4 text-[13px] text-foreground outline-none focus:border-primary",
            !hasAnyThreads && "cursor-not-allowed opacity-50",
          )}
        />

        <div className="mt-3 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              disabled={!hasAnyThreads}
              onClick={() => setTab(t.key)}
              className={cn(
                "h-8 cursor-pointer rounded-full px-4 text-[12px] font-semibold transition-colors",
                tab === t.key
                  ? "bg-[#a6e00c] text-[#2d3d00]"
                  : "border border-[#7b8466]/40 bg-[#fff9f5] text-[#7b8466]",
                !hasAnyThreads && "cursor-not-allowed opacity-50",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrolling list */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        {loading && (
          <p className="mt-8 text-center text-[14px] text-[#7d8760]">
            Loading your conversations…
          </p>
        )}

        {!loading && error && (
          <p className="mt-8 text-center text-[14px] text-red-600">{error}</p>
        )}

        {!loading && !error && !hasVisibleThreads && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-[14px] text-[#7d8760]">
              {hasAnyThreads
                ? "No conversations match your search."
                : "No conversations yet."}
            </p>
            {!hasAnyThreads && newChatButton}
          </div>
        )}

        {!loading && !error && hasVisibleThreads && (
          <div className="flex flex-col gap-2">
            {filteredThreads.map((thread) => {
              const isActive = thread.threadid === activeThreadId;
              return (
                <button
                  key={thread.threadid}
                  type="button"
                  onClick={() => onOpenThread(thread.threadid)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                    isActive
                      ? "border-[#a6e00c] bg-[#f1fad0]"
                      : "border-transparent hover:bg-[#f7f1e8]",
                  )}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#a6e00c] bg-[#e9f4cf] text-[15px] font-bold text-[#2d3d00]">
                    {thread.last_replied_by.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thread.last_replied_by.image}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      (thread.last_replied_by.name || "?")
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[14px] font-bold text-[#2d3d00]">
                        {thread.last_replied_by.name || "Kanopi Support"}
                      </span>
                      <span className="shrink-0 text-[11px] text-[#7d8760]">
                        {thread.last_message?.timestamp}
                      </span>
                    </span>
                    <span className="block text-[11px] text-[#7b8466] opacity-75">
                      {thread.last_replied_by.role}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[#7b8466]">
                        {thread.last_message?.message}
                      </span>
                      {thread.status && (
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                            statusBadgeClass(thread.status),
                          )}
                        >
                          {thread.status}
                        </span>
                      )}
                    </span>
                  </span>

                  {thread.unread_count > 0 && (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#a6e00c] text-[12px] font-bold text-[#2d3d00]">
                      {thread.unread_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pinned footer — the empty state already has its own New Chat. */}
      {!loading && !error && hasAnyThreads && (
        <div className="shrink-0 border-t border-[#7b8466]/25 p-3 sm:p-4">
          <div className="flex flex-col [&>button]:w-full">{newChatButton}</div>
        </div>
      )}
    </div>
  );
}
