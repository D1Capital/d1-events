"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MainContent } from "@/components/layout/main-content";
import {
  TelegramBackButtonManager,
  TelegramGate,
  TelegramInit,
} from "@/integrations/telegram";

/** Оболочка Telegram Mini App с навигацией и проверкой входа. */
export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TelegramInit />
      <TelegramGate>
        <TelegramBackButtonManager />
        <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
          <DesktopSidebar />
          <div className="min-w-0 flex-1 overflow-x-hidden lg:overflow-y-auto">
            <MainContent>{children}</MainContent>
          </div>
        </div>
        <BottomNav />
      </TelegramGate>
    </>
  );
}
