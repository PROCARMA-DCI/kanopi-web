"use client";

import { useScroll } from "@/app/ScrollProvider";
import { useState } from "react";
import { DashboardScreen } from "../screens/DashboardScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { MessagesScreen } from "../screens/MessagesScreen";
import type { PurchasedPlan } from "../screens/LoginScreen";
import { ThreadScreen } from "../screens/ThreadScreen";
import { FlowProvider, useFlow } from "../wizard/FlowProvider";

const TOTAL = 1;

// Fixed DOM ids each post-login screen mounts under — scrollTo targets one
// of these instead of any conditional-render view switch, matching how
// NoAccountFlow moves between its own screens. DashboardScreen mounts
// under flow.resultId (FlowProvider's own "<flowKey>-result", already
// scrolled to automatically once flow.finished) rather than a separate id.
const MESSAGES_ID = "yes-account-messages";
const THREAD_ID = "yes-account-thread";

function Screens() {
  const flow = useFlow();
  const { scrollTo } = useScroll();

  // Messages/Thread aren't linear wizard steps (no progress bar), so they
  // live as plain local reveal flags rather than FlowProvider steps — but
  // once revealed they stay mounted forever too, same as every other
  // screen here, so scrolling back to them never re-fetches for free
  // (that's what MessagesScreen's own useRevisit hook is for). threadId
  // stays separate from "is the thread screen revealed at all" — a brand
  // new/unsaved chat is revealed with threadId still null (see
  // ThreadScreen's own "first message creates the thread" mode).
  const [messagesRevealed, setMessagesRevealed] = useState(false);
  const [threadRevealed, setThreadRevealed] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  return (
    <>
      {flow.revealed >= 1 && <LoginScreen index={0} />}
      {flow.finished && (
        <DashboardScreen
          onOpenMessages={(policy: PurchasedPlan) => {
            flow.patch({ contract: policy });
            setMessagesRevealed(true);
            scrollTo(MESSAGES_ID);
          }}
        />
      )}
      {flow.finished && messagesRevealed && (
        <MessagesScreen
          onGoToDashboard={() => scrollTo(flow.resultId)}
          onOpenThread={(threadId) => {
            setActiveThreadId(threadId);
            setThreadRevealed(true);
            scrollTo(THREAD_ID);
          }}
          onStartNewChat={() => {
            setActiveThreadId(null);
            setThreadRevealed(true);
            scrollTo(THREAD_ID);
          }}
        />
      )}
      {flow.finished && threadRevealed && (
        <ThreadScreen
          threadId={activeThreadId}
          onThreadCreated={setActiveThreadId}
          onBack={() => scrollTo(MESSAGES_ID)}
        />
      )}
    </>
  );
}

export function YesAccountFlow({ onRestart }: { onRestart: () => void }) {
  return (
    <FlowProvider flowKey="yes-account" total={TOTAL} onRestart={onRestart}>
      <Screens />
    </FlowProvider>
  );
}
