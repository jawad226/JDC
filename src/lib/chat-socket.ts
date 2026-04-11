import type { ChatMessage } from '@/lib/messaging';

/** Frontend-only “socket”: same-tab + cross-component real-time updates when messages change. */
export type ChatSocketPayload = {
  type: 'message:new';
  chatId: string;
  message: ChatMessage;
  source: 'send' | 'incoming' | 'forward';
};

const EVENT = 'gdc-chat-socket';

export function emitChatSocketEvent(payload: ChatSocketPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: payload }));
}

export function subscribeChatSocket(handler: (payload: ChatSocketPayload) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<ChatSocketPayload>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
