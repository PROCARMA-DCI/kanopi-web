"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestDashboardRestore, useMessagesSession } from "./messagesSession";
import { RatesHeader } from "./RatesHeader";
import { MessagesScreen } from "./screens/MessagesScreen";
import { ThreadScreen } from "./screens/ThreadScreen";

/** Shared look of the two panes. */
const PANE =
  "min-h-0 overflow-hidden rounded-2xl border-[1.5px] border-[#7b8466] bg-[#fff9f5] shadow-[0px_4px_22px_rgba(129,74,0,0.12)]";

/**
 * The /messages page: thread list on the left, open conversation on the
 * right. From `lg` up both panes show side by side; below that only ONE
 * shows at a time (list → tap a thread → conversation → back arrow), so the
 * same two screens work on phone and desktop with just a visibility switch.
 *
 * `chatOpen` is "is a conversation showing"; `activeThreadId` is which one
 * (null while chatOpen = a brand-new, unsaved chat).
 */
export function MessagesPage() {
  const router = useRouter();
  const session = useMessagesSession();

  const [chatOpen, setChatOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  // Bumped when a new chat gets its real id, so the list picks it up.
  const [listReload, setListReload] = useState(0);

  const openThread = (id: string | null) => {
    setActiveThreadId(id);
    setChatOpen(true);
  };

  return (
    <>
      <RatesHeader title="Messages" />

      <main className="h-dvh px-3 pb-3 pt-[84px] sm:px-6 sm:pb-6 sm:pt-[110px]">
        {/* Hydrating — storage isn't readable until the client takes over. */}
        {session === undefined ? null : session === null ? (
          <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-4 text-center">
            <p className="text-[15px] text-[#7d8760]">
              Your session has ended. Please sign in again to see your
              messages.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="h-11 cursor-pointer rounded-xl bg-[#a6e00c] px-6 text-[14px] font-bold text-[#2d3d00]"
            >
              Go to home
            </button>
          </div>
        ) : (
          <div className="mx-auto flex h-full max-w-6xl flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                requestDashboardRestore();
                router.push("/");
              }}
              className="w-fit cursor-pointer text-[13px] font-semibold text-[#7b8466] hover:text-[#2d3d00]"
            >
              ← Back to dashboard
            </button>

            <div className="flex min-h-0 flex-1 gap-4">
              <aside
                className={cn(
                  PANE,
                  "w-full lg:block lg:w-[380px] lg:shrink-0 xl:w-[420px]",
                  chatOpen && "hidden",
                )}
              >
                <MessagesScreen
                  contract={session.contract}
                  activeThreadId={activeThreadId}
                  reloadKey={listReload}
                  onOpenThread={openThread}
                  onStartNewChat={() => openThread(null)}
                />
              </aside>

              <section
                className={cn(
                  PANE,
                  "min-w-0 flex-1 lg:block",
                  !chatOpen && "hidden",
                )}
              >
                {chatOpen ? (
                  <ThreadScreen
                    threadId={activeThreadId}
                    session={session}
                    onBack={() => setChatOpen(false)}
                    onThreadCreated={(id) => {
                      setActiveThreadId(id);
                      setListReload((n) => n + 1);
                    }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                    <span className="text-[40px]">💬</span>
                    <p className="text-[16px] font-bold text-[#2d3d00]">
                      Select a conversation
                    </p>
                    <p className="text-[13px] text-[#7d8760]">
                      Pick one from the list, or start a new chat.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
