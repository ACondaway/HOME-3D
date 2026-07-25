"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  resolvePhotographyEntryIds,
  type ContentLocale,
  type SiteMediaConfig,
} from "./content-config";
import type { PortfolioAsset } from "./portfolio-data";

type PhotographyMedia = NonNullable<SiteMediaConfig["photography"]>;
type PortfolioEntry = PortfolioAsset["entries"][number];

interface PhotoRecord {
  id: string;
  entry: PortfolioEntry;
  source?: string;
  originalIndex: number;
}

function PhotoImage({
  source,
  alt,
}: {
  source?: string;
  alt: string;
}) {
  const [failedSource, setFailedSource] = useState<string>();

  if (!source || source === failedSource) {
    return (
      <div className="photo-placeholder" role="img" aria-label={alt}>
        <span aria-hidden="true">＋</span>
      </div>
    );
  }

  return (
    // Uploaded images use runtime paths and cannot be statically imported.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={source}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSource(source)}
    />
  );
}

export function PhotographyGallery({
  asset,
  locale,
  media,
}: {
  asset: PortfolioAsset;
  locale: ContentLocale;
  media?: PhotographyMedia;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);

  const photos = useMemo<PhotoRecord[]>(
    () => {
      const ids = resolvePhotographyEntryIds(asset.entries);
      return asset.entries.map((entry, index) => {
        const id = ids[index]!;
        return {
          id,
          entry,
          source: media?.sources?.[id],
          originalIndex: index,
        };
      });
    },
    [asset.entries, media?.sources],
  );

  const spotlightId = photos.some((photo) => photo.id === media?.spotlightId)
    ? media?.spotlightId
    : photos[0]?.id;

  const orderedPhotos = useMemo(
    () =>
      [...photos].sort((first, second) => {
        if (first.id === spotlightId) return -1;
        if (second.id === spotlightId) return 1;
        return first.originalIndex - second.originalIndex;
      }),
    [photos, spotlightId],
  );

  const selectedPhoto =
    photos.find((photo) => photo.id === selectedId) ?? null;

  const closePhoto = useCallback(() => {
    setSelectedId(null);
    window.requestAnimationFrame(() => activeTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!selectedPhoto) return;

    const focusFrame = window.requestAnimationFrame(() =>
      closeButtonRef.current?.focus(),
    );
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closePhoto();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [closePhoto, selectedPhoto]);

  return (
    <>
      <section
        className="photography-contact-sheet"
        aria-label={
          locale === "zh" ? "摄影系列接触印样" : "Photography contact sheet"
        }
      >
        <header className="photography-sheet-header">
          <span>CONTACT SHEET / {String(photos.length).padStart(2, "0")}</span>
          <span>
            {locale === "zh" ? "点击照片查看相纸" : "SELECT A FRAME"}
          </span>
        </header>
        <div className="photography-sheet-grid">
          {orderedPhotos.map((photo, index) => {
            const isSpotlight = photo.id === spotlightId;
            const alt =
              photo.entry.imageAlt?.trim() || photo.entry.title;
            const tileStyle = {
              "--photo-order": index,
            } as CSSProperties;

            return (
              <button
                type="button"
                className={`photography-tile ${
                  isSpotlight ? "is-spotlight" : ""
                } photo-variant-${(photo.originalIndex % 6) + 1}`}
                key={photo.id}
                style={tileStyle}
                onClick={(event) => {
                  activeTriggerRef.current = event.currentTarget;
                  setSelectedId(photo.id);
                }}
                aria-label={
                  locale === "zh"
                    ? `打开相纸：${photo.entry.title}`
                    : `Open instant photo: ${photo.entry.title}`
                }
              >
                <PhotoImage source={photo.source} alt={alt} />
                <span className="photography-tile-index">
                  {String(photo.originalIndex + 1).padStart(2, "0")}
                </span>
                {isSpotlight && (
                  <span className="photography-spotlight-label">
                    SPOTLIGHT
                  </span>
                )}
                <strong>{photo.entry.title}</strong>
              </button>
            );
          })}
        </div>
      </section>

      {selectedPhoto && (
        <div className="instant-photo-layer">
          <button
            type="button"
            className="instant-photo-backdrop"
            aria-label={
              locale === "zh" ? "关闭相纸" : "Close instant photo"
            }
            onClick={closePhoto}
          />
          <article
            ref={dialogRef}
            className="instant-photo-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`instant-photo-title-${selectedPhoto.id}`}
            aria-describedby={`instant-photo-body-${selectedPhoto.id}`}
          >
            <header>
              <span>
                FRAME{" "}
                {String(selectedPhoto.originalIndex + 1).padStart(2, "0")}
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closePhoto}
                aria-label={
                  locale === "zh" ? "关闭相纸" : "Close instant photo"
                }
              >
                <span aria-hidden="true">×</span>
                <small>ESC</small>
              </button>
            </header>
            <div className="instant-photo-paper">
              <figure>
                <PhotoImage
                  source={selectedPhoto.source}
                  alt={
                    selectedPhoto.entry.imageAlt?.trim() ||
                    selectedPhoto.entry.title
                  }
                />
              </figure>
              <div className="instant-photo-caption">
                <p>{selectedPhoto.entry.eyebrow}</p>
                <h3 id={`instant-photo-title-${selectedPhoto.id}`}>
                  {selectedPhoto.entry.title}
                </h3>
                <div id={`instant-photo-body-${selectedPhoto.id}`}>
                  {selectedPhoto.entry.body}
                </div>
                <span>{selectedPhoto.entry.meta}</span>
              </div>
            </div>
          </article>
        </div>
      )}
    </>
  );
}
