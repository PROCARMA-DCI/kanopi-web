"use client";

import { fetching } from "@/lib/api/client";
import { useCallback, useMemo, useRef, useState } from "react";
import { ACCOUNT } from "../data/account";
import type {
  KanopiMessageListResponse,
  KanopiThreadSummary,
} from "../data/messages";
import { useFlow } from "../wizard/FlowProvider";
import { ScreenShell } from "../wizard/ScreenShell";
import { useRevisit } from "../wizard/useRevisit";
import type { PurchasedPlan } from "./LoginScreen";

interface MessagesScreenProps {
  onOpenThread: (threadId: string) => void;
  onStartNewChat: () => void;
  onGoToDashboard: () => void;
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
 * Thread list (Figma 2901:1143, mobile — no desktop mock exists yet, this
 * is an adaptation, not a pixel port). Same ScreenShell every other
 * YesAccountFlow/NoAccountFlow screen uses. Screens here never unmount
 * once revealed (same continuously-mounted, scroll-based flow as
 * NoAccountFlow), so a plain mount-only fetch would only ever run once —
 * useRevisit re-runs `load` every time this screen scrolls back into
 * view, not just on first mount.
 *
 * Title/active-plan bar/search/tabs always render — only the area below
 * them swaps: POST /kanopiThreads' `success` flag tells the two cases
 * apart — success 1 with threads means a real list; success 0 (or an
 * empty list) is NOT an error, it just means this policy has no claim
 * thread yet, so a centered "New Chat" prompt shows instead. When threads
 * DO exist, "New Chat" moves to a pinned bottom-right button instead.
 */
export function MessagesScreen({
  onOpenThread,
  onStartNewChat,
  onGoToDashboard,
}: MessagesScreenProps) {
  const flow = useFlow();
  const rootRef = useRef<HTMLDivElement>(null);

  const [threads, setThreads] = useState<KanopiThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  // The policy card whose "File Claim" button opened Messages — scopes
  // the thread list to that plan and drives the "Active Plan" bar.
  const contract = flow.data.contract as PurchasedPlan | undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetching<KanopiMessageListResponse>({
      url: "/api/kanopiThreads",
      method: "POST",
      isFormdata: true,
      body: { contractid: contract?.plan_id ?? "" },
    });
    setLoading(false);
    if (!res.ok) {
      setError("Couldn't load your messages — please try again.");
      return;
    }
    // success === 0 just means "no claim thread for this policy yet" — not
    // an error, the New Chat prompt below already covers that case.
    setThreads(
      res.success === 1 && Array.isArray(res.threads) ? res.threads : [],
    );
  }, [contract?.plan_id]);

  useRevisit(rootRef, load);

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
      className="flex h-11 cursor-pointer items-center gap-1.5 rounded-full bg-[#a6e00c] px-5 text-[13px] font-bold text-[#2d3d00] shadow-[0px_4px_14px_rgba(129,74,0,0.25)] transition-shadow hover:shadow-[0px_6px_18px_rgba(166,224,12,0.4)] sm:h-12 sm:text-[15px]"
    >
      <span className="text-[16px] leading-none">+</span> New Chat
    </button>
  );

  return (
    <div ref={rootRef}>
      <ScreenShell
        id="yes-account-messages"
        index={0}
        total={1}
        completion={1}
        title="Messages"
        canAdvance
        onBack={onGoToDashboard}
        contentClassName="max-w-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-bold text-[#2d3d00] sm:text-[28px]">
              Messages
            </h1>
            <p className="mt-1 text-[13px] text-[#7d8760] sm:text-[15px]">
              {unreadTotal > 0
                ? `${unreadTotal} unread conversation${unreadTotal === 1 ? "" : "s"}`
                : "All caught up"}
            </p>
          </div>
        </div>

        {/* Active plan bar */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-[1.5px] border-[#7b8466] bg-[#fff9f5] px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <p className="text-[11px] text-[#7b8466] sm:text-[12px]">
              Active Plan
            </p>
            <p className="truncate text-[13px] font-semibold text-[#2d3d00] sm:text-[15px]">
              {contract?.title ?? ACCOUNT.planName}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#a6e00c] px-3 py-1 text-[11px] font-bold text-[#2d3d00] sm:text-[12px]">
            Active
          </span>
        </div>

        {/* Search */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations…"
          className="mt-4 h-11 w-full rounded-xl border border-input bg-background px-4 text-[13px] text-foreground outline-none focus:border-primary sm:h-12 sm:text-[14px]"
        />

        {/* Tabs */}
        <div className="mt-3 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`h-9 cursor-pointer rounded-full px-4 text-[12px] font-semibold transition-colors sm:h-10 sm:text-[13px] ${
                tab === t.key
                  ? "bg-[#a6e00c] text-[#2d3d00]"
                  : "border border-[#7b8466]/40 bg-[#fff9f5] text-[#7b8466]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <p className="mt-8 text-center text-[14px] text-[#7d8760]">
            Loading your conversations…
          </p>
        )}

        {!loading && error && (
          <p className="mt-8 text-center text-[14px] text-red-600">{error}</p>
        )}

        {!loading && !error && !hasVisibleThreads && (
          <div className="mt-10 flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-[14px] text-[#7d8760]">
              {hasAnyThreads
                ? "No conversations match your search."
                : "No conversations yet."}
            </p>
            {newChatButton}
          </div>
        )}

        {!loading && !error && hasVisibleThreads && (
          <>
            <div className="mt-6 flex flex-col gap-3">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.threadid}
                  type="button"
                  onClick={() => onOpenThread(thread.threadid)}
                  className="flex cursor-pointer items-center gap-4 rounded-2xl border-[1.5px] border-[#7b8466] bg-[#fff9f5] p-4 text-left shadow-[0px_3px_12px_rgba(129,74,0,0.08)] transition-shadow hover:shadow-[0px_5px_18px_rgba(129,74,0,0.15)] sm:p-5"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#a6e00c] bg-[#e9f4cf] text-[16px] font-bold text-[#2d3d00] sm:size-14">
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
                      <span className="truncate text-[15px] font-bold text-[#2d3d00] sm:text-[17px]">
                        {thread.last_replied_by.name || "Kanopi Support"}
                      </span>
                      <span className="shrink-0 text-[12px] text-[#7d8760]">
                        {thread.last_message?.timestamp}
                      </span>
                    </span>
                    <span className="text-[12px] text-[#7b8466] opacity-75 sm:text-[13px]">
                      {thread.last_replied_by.role}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[#7b8466] sm:text-[15px]">
                        {thread.last_message?.message}
                      </span>
                      {thread.status && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold sm:text-[11px] ${statusBadgeClass(thread.status)}`}
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
              ))}
            </div>

            <div className="sticky bottom-4 z-10 mt-6 flex justify-end">
              {newChatButton}
            </div>
          </>
        )}
      </ScreenShell>
    </div>
  );
}
