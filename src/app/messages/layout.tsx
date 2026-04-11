import type { ReactNode } from 'react';

/** Fills main below topbar; parent main has no padding on this route (see globals.css). */
export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="messages-route-root flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {children}
    </div>
  );
}
