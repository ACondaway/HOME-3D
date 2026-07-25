"use client";

import { useEffect, useRef, useState } from "react";
import {
  CONTENT_LIMITS,
  isValidContentCardLinkUrl,
  resolveContentCardKind,
  resolveContentCardWidth,
  type ContentLocale,
} from "./content-config";
import { ImageUploadField } from "./ImageUploadField";
import {
  type ContentCardKind,
  type ContentCardWidth,
  type PortfolioEntry,
} from "./portfolio-data";

interface ContentCardListEditorProps {
  locale: ContentLocale;
  entries: readonly PortfolioEntry[];
  projectWritable: boolean;
  onChange: (entries: PortfolioEntry[]) => void;
}

type TextKey = "eyebrow" | "title" | "body" | "meta";

const TEXT_KEYS = [
  "eyebrow",
  "title",
  "body",
  "meta",
] as const satisfies readonly TextKey[];

const CARD_KINDS = [
  "text",
  "media",
  "links",
] as const satisfies readonly ContentCardKind[];

const CARD_WIDTHS = [
  "standard",
  "wide",
  "full",
] as const satisfies readonly ContentCardWidth[];

function createEditorId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function alignEditorKeys(
  current: readonly string[],
  entries: readonly PortfolioEntry[],
): string[] {
  return entries.map(
    (entry, index) =>
      entry.id ?? current[index] ?? createEditorId("editor-card"),
  );
}

function TextField({
  label,
  value,
  multiline = false,
  wide = false,
  type = "text",
  invalid = false,
  onChange,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  wide?: boolean;
  type?: "text" | "url";
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`studio-field ${wide ? "is-wide" : ""}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          type={type}
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

export function ContentCardListEditor({
  locale,
  entries,
  projectWritable,
  onChange,
}: ContentCardListEditorProps) {
  const [editorKeys, setEditorKeys] = useState(() =>
    entries.map(
      (entry) => entry.id ?? createEditorId("editor-card"),
    ),
  );
  const entriesRef = useRef(entries);
  const editorKeysRef = useRef(editorKeys);
  const onChangeRef = useRef(onChange);
  const mountedRef = useRef(true);

  useEffect(() => {
    entriesRef.current = entries;
    onChangeRef.current = onChange;
  }, [entries, onChange]);

  useEffect(() => {
    editorKeysRef.current = editorKeys;
  }, [editorKeys]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const copy =
    locale === "zh"
      ? {
          card: "内容卡",
          type: "卡片类型",
          text: "纯文字",
          media: "图文",
          links: "链接按钮",
          width: "页面宽度",
          standard: "标准 · 1/3",
          wide: "宽 · 1/2",
          full: "整行 · 1/1",
          moveUp: "上移",
          moveDown: "下移",
          remove: "删除",
          image: "卡片图片",
          imageHelp: "拖动图片到上传区，或从设备中选择文件。",
          imageAlt: "图片替代文本",
          linkLabel: "按钮文字",
          linkUrl: "链接地址",
          addLink: "添加链接按钮",
          removeLink: "移除链接",
          linkLimit: "每张卡最多 4 个链接按钮",
          invalidLink:
            "请填写按钮文字，并使用 http://、https:// 或 mailto: 链接",
          addText: "添加纯文字卡",
          addMedia: "添加图文卡",
          addLinks: "添加链接按钮卡",
          limit: "已达到内容卡片上限",
          fields: {
            eyebrow: "眉题",
            title: "标题",
            body: "正文",
            meta: "补充信息",
          },
        }
      : {
          card: "Content card",
          type: "Card type",
          text: "Text",
          media: "Image + text",
          links: "Link buttons",
          width: "Page width",
          standard: "Standard · 1/3",
          wide: "Wide · 1/2",
          full: "Full row · 1/1",
          moveUp: "Move up",
          moveDown: "Move down",
          remove: "Delete",
          image: "Card image",
          imageHelp: "Drop an image here or choose one from your device.",
          imageAlt: "Image alternative text",
          linkLabel: "Button label",
          linkUrl: "Link URL",
          addLink: "Add link button",
          removeLink: "Remove link",
          linkLimit: "Each card supports up to 4 link buttons",
          invalidLink:
            "Add button text and use an http://, https://, or mailto: URL",
          addText: "Add text card",
          addMedia: "Add image card",
          addLinks: "Add link-button card",
          limit: "Content card limit reached",
          fields: {
            eyebrow: "Eyebrow",
            title: "Title",
            body: "Body",
            meta: "Metadata",
          },
        };

  const commitEditorKeys = (nextKeys: string[]) => {
    editorKeysRef.current = nextKeys;
    setEditorKeys(nextKeys);
  };

  const commitEntries = (nextEntries: PortfolioEntry[]) => {
    entriesRef.current = nextEntries;
    onChangeRef.current(nextEntries);
  };

  const updateEntry = (
    index: number,
    patch: Partial<PortfolioEntry>,
  ) => {
    commitEntries(
      entriesRef.current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const updateUploadedImage = (
    editorKey: string,
    imageSrc: string,
  ) => {
    if (!mountedRef.current) return;
    const latestEntries = entriesRef.current;
    const latestKeys = editorKeysRef.current;
    const targetIndex = latestEntries.findIndex(
      (entry, index) => (entry.id ?? latestKeys[index]) === editorKey,
    );
    if (targetIndex < 0) return;

    const nextEntries = latestEntries.map((entry, index) =>
      index === targetIndex ? { ...entry, imageSrc } : entry,
    );
    commitEntries(nextEntries);
  };

  const moveEntry = (index: number, offset: -1 | 1) => {
    const currentEntries = entriesRef.current;
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= currentEntries.length) return;
    const next = [...currentEntries];
    [next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!];
    const nextKeys = alignEditorKeys(editorKeysRef.current, currentEntries);
    [nextKeys[index], nextKeys[targetIndex]] = [
      nextKeys[targetIndex]!,
      nextKeys[index]!,
    ];
    commitEditorKeys(nextKeys);
    commitEntries(next);
  };

  const removeEntry = (index: number) => {
    const currentEntries = entriesRef.current;
    commitEditorKeys(
      alignEditorKeys(editorKeysRef.current, currentEntries).filter(
        (_, entryIndex) => entryIndex !== index,
      ),
    );
    commitEntries(
      currentEntries.filter((_, entryIndex) => entryIndex !== index),
    );
  };

  const addEntry = (kind: ContentCardKind) => {
    const currentEntries = entriesRef.current;
    if (currentEntries.length >= CONTENT_LIMITS.asset.entries) return;
    const title =
      locale === "zh"
        ? kind === "text"
          ? "新的文字卡片"
          : kind === "media"
            ? "新的图文卡片"
            : "新的链接卡片"
        : kind === "text"
          ? "New text card"
          : kind === "media"
            ? "New image card"
            : "New link card";
    const width: ContentCardWidth =
      kind === "text" ? "standard" : "wide";
    const entry: PortfolioEntry = {
      id: createEditorId("card"),
      kind,
      width,
      eyebrow: "NEW",
      title,
      body: "",
      meta: "",
      ...(kind === "media"
        ? { imageAlt: "" }
        : kind === "links"
          ? { links: [] }
          : {}),
    };
    commitEditorKeys([
      ...alignEditorKeys(editorKeysRef.current, currentEntries),
      entry.id!,
    ]);
    commitEntries([...currentEntries, entry]);
  };

  const kindLabel = (kind: ContentCardKind) => copy[kind];
  const widthLabel = (width: ContentCardWidth) => copy[width];

  return (
    <div className="studio-card-editor">
      {entries.map((entry, index) => {
        const kind = resolveContentCardKind(entry);
        const width = resolveContentCardWidth(entry);
        const links = entry.links ?? [];
        const editorKey =
          entry.id ??
          editorKeys[index] ??
          `editor:external:${index}`;

        return (
          <article
            className={`studio-repeater-item is-entry is-${kind}`}
            key={editorKey}
          >
            <header className="studio-card-editor-header">
              <span className="studio-repeater-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <strong>{entry.title || copy.card}</strong>
              <div className="studio-card-layout-actions">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveEntry(index, -1)}
                  aria-label={`${copy.moveUp}: ${entry.title || copy.card}`}
                >
                  ↑ {copy.moveUp}
                </button>
                <button
                  type="button"
                  disabled={index === entries.length - 1}
                  onClick={() => moveEntry(index, 1)}
                  aria-label={`${copy.moveDown}: ${entry.title || copy.card}`}
                >
                  ↓ {copy.moveDown}
                </button>
                <button
                  type="button"
                  className="studio-remove-button"
                  onClick={() => removeEntry(index)}
                >
                  {copy.remove}
                </button>
              </div>
            </header>

            <div
              className="studio-card-type-grid"
              role="group"
              aria-label={copy.type}
            >
              {CARD_KINDS.map((candidate) => (
                <button
                  type="button"
                  key={candidate}
                  className={candidate === kind ? "is-active" : ""}
                  aria-pressed={candidate === kind}
                  onClick={() => updateEntry(index, { kind: candidate })}
                >
                  {kindLabel(candidate)}
                </button>
              ))}
            </div>

            <label className="studio-field studio-card-width-field">
              <span>{copy.width}</span>
              <select
                value={width}
                onChange={(event) =>
                  updateEntry(index, {
                    width: event.target.value as ContentCardWidth,
                  })
                }
              >
                {CARD_WIDTHS.map((candidate) => (
                  <option value={candidate} key={candidate}>
                    {widthLabel(candidate)}
                  </option>
                ))}
              </select>
            </label>

            <div className="studio-field-grid">
              {TEXT_KEYS.map((key) => (
                <TextField
                  key={key}
                  label={copy.fields[key]}
                  value={entry[key]}
                  multiline={key === "body"}
                  wide={key === "body"}
                  onChange={(value) => updateEntry(index, { [key]: value })}
                />
              ))}
            </div>

            {kind === "media" && (
              <div className="studio-card-media-editor">
                <ImageUploadField
                  locale={locale}
                  kind="cards"
                  label={copy.image}
                  description={copy.imageHelp}
                  value={entry.imageSrc}
                  alt={entry.imageAlt ?? entry.title}
                  fallback="IMG"
                  disabled={!projectWritable}
                  onUploaded={(imageSrc) =>
                    updateUploadedImage(editorKey, imageSrc)
                  }
                  onClear={() =>
                    updateEntry(index, { imageSrc: undefined })
                  }
                />
                <TextField
                  label={copy.imageAlt}
                  value={entry.imageAlt ?? ""}
                  onChange={(imageAlt) => updateEntry(index, { imageAlt })}
                  wide
                />
              </div>
            )}

            {kind === "links" && (
              <div className="studio-card-link-list">
                {links.map((link, linkIndex) => {
                  const labelInvalid = link.label.trim() === "";
                  const urlInvalid =
                    link.url.trim() === "" ||
                    !isValidContentCardLinkUrl(link.url);

                  return (
                    <div key={linkIndex}>
                      <div className="studio-card-link-row">
                        <TextField
                          label={copy.linkLabel}
                          value={link.label}
                          invalid={labelInvalid}
                          onChange={(label) =>
                            updateEntry(index, {
                              links: links.map((item, itemIndex) =>
                                itemIndex === linkIndex
                                  ? { ...item, label }
                                  : item,
                              ),
                            })
                          }
                        />
                        <TextField
                          label={copy.linkUrl}
                          value={link.url}
                          type="url"
                          invalid={urlInvalid}
                          onChange={(url) =>
                            updateEntry(index, {
                              links: links.map((item, itemIndex) =>
                                itemIndex === linkIndex
                                  ? { ...item, url }
                                  : item,
                              ),
                            })
                          }
                          wide
                        />
                        <button
                          type="button"
                          className="studio-remove-button"
                          onClick={() =>
                            updateEntry(index, {
                              links: links.filter(
                                (_, itemIndex) => itemIndex !== linkIndex,
                              ),
                            })
                          }
                          aria-label={`${copy.removeLink}: ${link.label || linkIndex + 1}`}
                        >
                          {copy.removeLink}
                        </button>
                      </div>
                      {(labelInvalid || urlInvalid) && (
                        <p
                          className="studio-validation-message"
                          role="alert"
                        >
                          {copy.invalidLink}
                        </p>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="studio-add-button"
                  disabled={
                    links.length >= CONTENT_LIMITS.asset.links
                  }
                  title={
                    links.length >= CONTENT_LIMITS.asset.links
                      ? copy.linkLimit
                      : undefined
                  }
                  onClick={() =>
                    updateEntry(index, {
                      links: [
                        ...links,
                        {
                          label:
                            locale === "zh" ? "新的链接" : "New link",
                          url: "",
                        },
                      ],
                    })
                  }
                >
                  + {copy.addLink}
                </button>
              </div>
            )}
          </article>
        );
      })}

      <div className="studio-card-template-actions">
        <button
          type="button"
          className="studio-add-button"
          disabled={entries.length >= CONTENT_LIMITS.asset.entries}
          title={
            entries.length >= CONTENT_LIMITS.asset.entries
              ? copy.limit
              : undefined
          }
          onClick={() => addEntry("text")}
        >
          + {copy.addText}
        </button>
        <button
          type="button"
          className="studio-add-button"
          disabled={entries.length >= CONTENT_LIMITS.asset.entries}
          title={
            entries.length >= CONTENT_LIMITS.asset.entries
              ? copy.limit
              : undefined
          }
          onClick={() => addEntry("media")}
        >
          + {copy.addMedia}
        </button>
        <button
          type="button"
          className="studio-add-button"
          disabled={entries.length >= CONTENT_LIMITS.asset.entries}
          title={
            entries.length >= CONTENT_LIMITS.asset.entries
              ? copy.limit
              : undefined
          }
          onClick={() => addEntry("links")}
        >
          + {copy.addLinks}
        </button>
      </div>
    </div>
  );
}
