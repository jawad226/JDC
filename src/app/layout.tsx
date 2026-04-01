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
      <body className={`${inter.className} bg-slate-50 min-h-screen flex`}>
        <AuthProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
