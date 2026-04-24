/** Local dev only when `NEXT_PUBLIC_CHAT_API_URL` is unset. */
const DEFAULT_CHAT_DEV = 'http://localhost:5002';
/** Production fallback when env var is missing (Render). */
const DEFAULT_CHAT_PROD = 'https://chat-backend-y6j2.onrender.com';

export function resolveChatBaseURL(): string {
  const raw = process.env.NEXT_PUBLIC_CHAT_API_URL?.trim() ?? '';
  const normalized = raw.replace(/\/$/, '');
  if (normalized) return normalized;
  if (process.env.NODE_ENV === 'production') {
    console.error(
      `[chat-api] NEXT_PUBLIC_CHAT_API_URL is unset — using ${DEFAULT_CHAT_PROD}. Set it in Vercel env vars (no trailing slash).`
    );
    return DEFAULT_CHAT_PROD;
  }
  return DEFAULT_CHAT_DEV;
}

