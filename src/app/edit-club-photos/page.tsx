"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageLoader } from "@/components/ui/spinner";
import { useTelegram } from "@/integrations/telegram";

type SiteImage = { slot: number; url: string | null };

async function compressImage(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    image.src = objectUrl;
    await image.decode();
    const scale = Math.min(
      1,
      900 / image.naturalWidth,
      1600 / image.naturalHeight,
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Не удалось обработать изображение");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error("Не удалось сжать фото")),
        "image/jpeg",
        0.8,
      );
    });
    if (blob.size > 2 * 1024 * 1024) {
      throw new Error("Фото после сжатия больше 2 МБ");
    }
    return new File([blob], "club-cover.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function EditClubPhotosPage() {
  const { isAdmin, isLoading, authHeaders } = useTelegram();
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const loadImages = useCallback(async () => {
    const response = await fetch("/api/site-images", { cache: "no-store" });
    if (!response.ok) throw new Error("Не удалось загрузить обложки");
    const data = await response.json();
    setImages(data.images);
  }, []);

  useEffect(() => {
    if (isLoading || !isAdmin) return;
    loadImages()
      .catch((cause) => setError(cause.message))
      .finally(() => setLoadingImages(false));
  }, [isLoading, isAdmin, loadImages]);

  async function upload(slot: number, file: File) {
    setBusy(true);
    setError("");
    try {
      const compressed = await compressImage(file);
      const body = new FormData();
      body.append("file", compressed);
      const response = await fetch(`/api/site-images/${slot}`, {
        method: "POST",
        headers: authHeaders(),
        body,
      });
      if (!response.ok) throw new Error("Не удалось загрузить фото");
      await loadImages();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  }

  async function remove(slot: number) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/site-images/${slot}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("Не удалось удалить фото");
      await loadImages();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ошибка удаления");
    } finally {
      setBusy(false);
    }
  }

  async function swap(first: number, second: number) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/site-images/swap", {
        method: "POST",
        headers: { ...authHeaders(), "content-type": "application/json" },
        body: JSON.stringify({ first, second }),
      });
      if (!response.ok) throw new Error("Не удалось изменить порядок");
      await loadImages();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ошибка перестановки");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <PageLoader />;
  if (!isAdmin) {
    return (
      <div className="px-4 py-16 text-center text-sm text-muted-foreground">
        Эта страница доступна только администраторам.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Назад на главную"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Обложки мероприятий
          </h1>
          <p className="text-xs text-muted-foreground">
            Порядок слева направо на главной
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {loadingImages ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map(({ slot, url }) => (
            <div
              key={slot}
              className="rounded-2xl border border-border bg-card p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">Обложка {slot}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Переместить обложку ${slot} левее`}
                    disabled={busy || slot === 1}
                    onClick={() => swap(slot, slot - 1)}
                    className="flex size-11 items-center justify-center rounded-xl border border-border disabled:opacity-30"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Переместить обложку ${slot} правее`}
                    disabled={busy || slot === 3}
                    onClick={() => swap(slot, slot + 1)}
                    className="flex size-11 items-center justify-center rounded-xl border border-border disabled:opacity-30"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              </div>
              <div className="relative mx-auto aspect-[9/16] w-full max-w-[180px] overflow-hidden rounded-xl bg-muted">
                {url ? (
                  <Image
                    src={url}
                    alt={`Обложка ${slot}`}
                    fill
                    sizes="180px"
                    className="object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Нет фото
                  </div>
                )}
              </div>
              <input
                ref={(element) => {
                  fileInputs.current[slot] = element;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) upload(slot, file);
                  event.target.value = "";
                }}
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileInputs.current[slot]?.click()}
                  className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  <ImagePlus className="size-4" />
                  {url ? "Заменить" : "Загрузить"}
                </button>
                <button
                  type="button"
                  aria-label={`Удалить обложку ${slot}`}
                  disabled={busy || !url}
                  onClick={() => remove(slot)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border disabled:opacity-30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
