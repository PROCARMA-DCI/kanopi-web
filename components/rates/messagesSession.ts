"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { dashboardCustomerInfo, PurchasedPlan } from "./screens/LoginScreen";

/**
 * Everything the /messages page needs from the yes-account flow. That flow's
 * data lives in an in-memory FlowProvider on the home page, which a separate
 * route can't reach — so "File Claim" saves this here first, then navigates.
 * sessionStorage (not localStorage) so it dies with the tab and survives a
 * refresh of /messages.
 */
export interface MessagesSession {
  contract: PurchasedPlan;
  customerInfo?: dashboardCustomerInfo;
  /** Login's CustomerInfo.CustomerID — used to tell "my" messages apart. */
  customerId?: string;
  /** Copy of the yes-account flow's data, so Back can rebuild the dashboard. */
  flowData: Record<string, unknown>;
}

const KEY = "kanopi-messages-session";

export function saveMessagesSession(session: MessagesSession) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Storage blocked — the page just falls back to its "go back" state.
  }
}

function readRaw() {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

const subscribe = () => () => {};

/**
 * `undefined` while hydrating (storage isn't readable on the server),
 * `null` when nothing was saved, otherwise the saved session.
 */
export function useMessagesSession(): MessagesSession | null | undefined {
  const raw = useSyncExternalStore(subscribe, readRaw, () => undefined);
  return useMemo(() => {
    if (raw === undefined) return undefined;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as MessagesSession;
    } catch {
      return null;
    }
  }, [raw]);
}

const RESTORE_KEY = "kanopi-restore-dashboard";

/** Back from /messages: ask the home page to reopen the dashboard. */
export function requestDashboardRestore() {
  try {
    sessionStorage.setItem(RESTORE_KEY, "1");
  } catch {}
}

export function wantsDashboardRestore() {
  try {
    return sessionStorage.getItem(RESTORE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Called once the dashboard is back, so a later plain visit starts fresh. */
export function clearDashboardRestore() {
  try {
    sessionStorage.removeItem(RESTORE_KEY);
  } catch {}
}

/** The flow data saved by "File Claim", or null if there isn't any. */
export function readSavedFlowData(): Record<string, unknown> | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MessagesSession).flowData : null;
  } catch {
    return null;
  }
}
