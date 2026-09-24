"use client";

import {
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Gift,
  MessageSquarePlus,
  MessagesSquare,
  Plus,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, EventCardSkeleton } from "@/components/ui/animated";
import { Card } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { EventCard, type EventPreview } from "@/features/events";
import { useTelegram } from "@/integrations/telegram";

/** Главная страница: приветствие, статистика, ближайшие мероприятия. */
export default function HomePage() {
  const { dbUser, isLoading, authHeaders } = useTelegram();
  const [events, setEvents] = useState<EventPreview[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!dbUser) {
      setLoadingData(false);
      return;
    }
    async function load() {
      try {
        const headers = authHeaders();
        const eventsRes = await fetch("/api/events?filter=upcoming", {
          headers,
        });
        if (eventsRes.ok) {
          const data = await eventsRes.json();
          setEvents(data.slice(0, 5));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, [isLoading, dbUser, authHeaders]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 lg:gap-5">
      <section className="animate-fade-in flex gap-3 rounded-2xl bg-muted/50 p-3 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.35),inset_0_0_0_1px_rgb(255_255_255/0.08)] lg:gap-4 lg:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
          <Image src="/logo.png" alt="Клуб" width={24} height={24} />
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-base font-bold tracking-tight lg:text-xl">
              Привет{dbUser ? `, ${dbUser.firstName}` : ""}!
            </h1>
            <p className="text-[11px] text-muted-foreground lg:text-xs">
              Добро пожаловать в клуб
            </p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] text-muted-foreground lg:text-xs">
              Сообщество единомышленников:
            </p>
            <ul className="flex flex-col gap-0.5 text-[11px] text-muted-foreground lg:text-xs">
              <li className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                участвуй в мероприятиях
              </li>
              <li className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                знакомься с участниками
              </li>
              <li className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                будь в курсе событий клуба
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Link
        href="/community-request"
        className="animate-fade-in flex items-center justify-between rounded-2xl bg-primary p-3 lg:p-4 text-black transition-colors hover:bg-primary/90"
      >
        <div>
          <p className="text-base font-bold tracking-tight lg:text-xl">
            Запрос в сообщество
          </p>
          <p className="text-[11px] opacity-60 lg:text-xs">напишите запрос</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white lg:h-10 lg:w-10">
          <Plus className="h-4 w-4 text-black lg:h-5 lg:w-5" />
        </div>
      </Link>

      <Link
        href="/events"
        className="animate-fade-in relative flex h-36 overflow-hidden rounded-2xl bg-card shadow-[0_2px_8px_0_rgb(0_0_0/0.08),inset_0_1px_0_0_rgb(255_255_255/0.35),inset_0_0_0_1px_rgb(255_255_255/0.08)]"
      >
        <div className="flex flex-col justify-end p-3 lg:p-4">
          <p className="text-base font-bold tracking-tight lg:text-xl">
            Мероприятия
          </p>
          <p className="text-[11px] text-muted-foreground lg:text-xs">клуба</p>
        </div>
        <div className="ml-auto py-2 pr-2">
          <Image
            src="/personal-strategy-club.jpg"
            alt="Второй поток тренинга по личной стратегии"
            width={86}
            height={128}
            className="h-32 w-[86px] rounded-xl object-cover"
          />
        </div>
      </Link>

      <section className="animate-slide-up stagger-5 grid grid-cols-2 gap-3">
        <Link href="/chats" className="flex">
          <Card className="card-interactive flex w-full items-center justify-between gap-3 p-3 lg:p-4">
            <div>
              <p className="text-sm font-bold tracking-tight lg:text-xl">
                Чаты и каналы
              </p>
              <p className="text-[10px] text-muted-foreground lg:text-xs">
                ссылки
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
              <MessagesSquare className="h-5 w-5 text-black" />
            </div>
          </Card>
        </Link>
        <Link href="/members" className="flex">
          <Card className="card-interactive flex w-full items-center justify-between gap-3 p-3 lg:p-4">
            <div>
              <p className="text-sm font-bold tracking-tight lg:text-xl">
                Участники
              </p>
              <p className="text-[10px] text-muted-foreground lg:text-xs">
                клуба
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
              <Users className="h-5 w-5 text-black" />
            </div>
          </Card>
        </Link>
        <Link href="/loyalty" className="col-span-2 flex">
          <Card className="card-interactive flex w-full items-center justify-between gap-3 p-3 lg:p-4">
            <div>
              <p className="text-base font-bold tracking-tight lg:text-xl">
                Программа лояльности
              </p>
              <p className="text-[11px] text-muted-foreground lg:text-xs">
                бонусы и привилегии
              </p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary lg:h-10 lg:w-10">
              <Gift className="h-4 w-4 text-black lg:h-5 lg:w-5" />
            </div>
          </Card>
        </Link>
        <a
          href="https://app.d1capital.ru/auth/login"
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-2 flex"
        >
          <Card className="card-interactive flex min-h-32 w-full items-end gap-2 p-2">
            <div className="flex-1 pb-1 pl-2">
              <p className="text-base font-bold tracking-tight lg:text-xl">
                D1 Платформа
              </p>
              <p className="text-[11px] text-muted-foreground lg:text-xs">
                инвестиции и капитал
              </p>
            </div>
            <div className="relative w-1/2 shrink-0 self-stretch overflow-hidden rounded-xl">
              <Image
                src="/d1-platform.png"
                alt="D1 Платформа"
                fill
                className="object-cover"
              />
            </div>
          </Card>
        </a>
      </section>

      <section className="animate-slide-up stagger-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            Ближайшие мероприятия
          </h2>
          <Link
            href="/events"
            className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Все <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingData ? (
          <div className="flex flex-col gap-3">
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        ) : events.length === 0 ? (
          <Card className="animate-scale-in">
            <EmptyState
              icon={CalendarDays}
              message="Пока нет предстоящих мероприятий"
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
            {events.map((event, index) => (
              <EventCard
                key={event.id}
                event={
                  event.title.toLowerCase() === "тренинг по личной стратегии" &&
                  event.date === "2026-09-26"
                    ? { ...event, coverUrl: "/personal-strategy-event.jpg" }
                    : event
                }
                linkClassName="flex"
                className={`animate-slide-up stagger-${Math.min(index + 6, 10)}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
