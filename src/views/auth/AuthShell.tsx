import type { ReactNode } from 'react';
import Image from 'next/image';
import { BRAND_LOGO_URL } from '@/lib/brand';

export default function AuthShell({
  title,
  children,
  wide = false,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  /** Longer forms (register): slightly wider card on tablet/desktop */
  wide?: boolean;
  /** Less vertical padding / smaller header (register) */
  compact?: boolean;
}) {
  const maxW = wide
    ? 'max-w-[min(100%,24rem)] sm:max-w-lg lg:max-w-xl'
    : 'max-w-[min(100%,24rem)] sm:max-w-md';

  return (
    <div
      className={`absolute inset-0 z-50 min-h-[100dvh] overflow-x-hidden overflow-y-auto overscroll-y-contain bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-3 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:px-5 ${compact ? 'pt-4 sm:py-8' : 'pt-6 sm:py-10'}`}
    >
      <div
        className={`mx-auto flex w-full flex-col justify-start sm:justify-center sm:py-0 ${compact ? 'min-h-0' : 'min-h-[calc(100dvh-3rem)] sm:min-h-0'}`}
      >
        <div className={`mx-auto w-full ${maxW}`}>
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur sm:rounded-3xl">
            <div
              className={`border-b border-slate-100 px-4 sm:px-8 ${compact ? 'pb-3 pt-5 sm:pb-4 sm:pt-6' : 'pb-5 pt-8 sm:pb-6 sm:pt-10'}`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`relative mx-auto w-full max-w-[min(100%,260px)] ${compact ? 'mb-2 h-8 sm:mb-2.5 sm:h-11' : 'mb-3 h-10 sm:mb-4 sm:h-14'}`}
                >
                  <Image
                    src={BRAND_LOGO_URL}
                    alt="Global Digital Care"
                    fill
                    className="object-contain object-center"
                    sizes="(max-width: 640px) 260px, 280px"
                    priority
                    draggable={false}
                  />
                </div>
                <h1
                  className={`text-center font-bold text-slate-900 ${compact ? 'mt-1 text-lg sm:text-xl' : 'mt-1.5 text-xl sm:mt-2 sm:text-2xl'}`}
                >
                  {title}
                </h1>
              </div>
            </div>

            <div className={`px-4 sm:px-8 ${compact ? 'py-4 sm:py-5' : 'py-6 sm:py-8'}`}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
