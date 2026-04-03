import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { AuthProvider } from '@/components/providers/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Global Digital Care | Assurgent',
  description: 'Digital Register System and HR Management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 antialiased`}>
        <AuthProvider>
          <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden">
            <div className="hidden h-full shrink-0 lg:block">
              <Sidebar />
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <Topbar />
              <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 p-8">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
