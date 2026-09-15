// Real shapes for the Kanopi messaging endpoints (/kanopiMessage,
// /kanopiThread, /kanopiSendMessage). Kept in one place since MessagesScreen
// and ThreadScreen both need them.

export interface ThreadLastMessage {
  message_id: string;
  message: string;
  timestamp: string;
}

export interface ThreadRepliedBy {
  name: string;
  role: string;
  image: string;
}

/** One row in the thread list (GET-ish summary — /kanopiMessage). */
export interface KanopiThreadSummary {
  threadid: string;
  last_message: ThreadLastMessage;
  last_replied_by: ThreadRepliedBy;
  status: string;
  unread_count: number;
  ContractNo: string;
}

// NOTE: this response's own top-level "message" field is a plain status
// STRING ("Kanopi threads fetched successfully"), not the thread list —
// fetching()'s `.message` alias would land on that string, so read
// `.threads`/`.total_threads` directly off the result instead (same
// "don't trust .message, read the real field" situation as
// /kanopi/payment-status elsewhere in this app).
export interface KanopiMessageListResponse {
  success: number;
  contractid: string;
  ContractNo: string;
  total_threads: number;
  threads: KanopiThreadSummary[];
}

export interface KanopiThreadDetail {
  threadid: number;
  ContractNo: string;
  user1: string;
  user1Name: string;
  User1Phone: string;
  User1Image: string;
  kanopi_thread_status: string;
}

export interface KanopiThreadMessage {
  message_id: number;
  threadid: number;
  user1: string;
  user1Name: string | null;
  User1Phone: string | null;
  User1Image: string | null;
  message: string;
  timestamp: string;
  user1read: string;
  user2read: string;
  device_type: string;
  ContractNo: string;
  kanopi_thread_status: string;
}

// Same "message" field caveat as above — read `.thread`/`.messages` directly.
export interface KanopiThreadResponse {
  success: number;
  thread: KanopiThreadDetail;
  total_messages: number;
  messages: KanopiThreadMessage[];
}

export interface KanopiSendMessageResponse {
  success: number;
  threadid: number;
  data: KanopiThreadMessage;
}

/**
 * One message row returned directly inside a brand-new chat's create
 * response (POST /kanopiMessage) — same person/timestamp fields as
 * KanopiThreadMessage, but message_id/id/threadid/status come back as
 * strings here instead of numbers.
 */
export interface KanopiNewChatMessage {
  message_id: string;
  id: string;
  threadid: string;
  title: string;
  user1: string;
  user1Name: string;
  User1Phone: string;
  User1Image: string;
  message: string;
  timestamp: string;
  user1read: string;
  user2read: string;
  status: string;
  device_type: string;
  ContractNo: string;
  kanopi_thread_status: string;
}

/**
 * Response for starting a brand-new claim thread (POST /kanopiMessage,
 * body: contract_id, user_id, customer_id, message) — used ONLY for a
 * policy's very first message, when no threadid exists yet. Every message
 * after this one goes through POST /kanopiSendMessage instead, against the
 * threadid this response hands back.
 */
export interface KanopiCreateChatResponse {
  success: number;
  message: string;
  threadid: number;
  contractid: string;
  ContractNo: string;
  kanopi_threads: KanopiNewChatMessage[];
}
