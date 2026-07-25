export const CONTENT_DRAFT_STORAGE_KEY =
  "living-index.content-draft.v1";

/**
 * Browser drafts are an authoring concern. A normal published page must always
 * render the source-controlled content and scene snapshot, even when the same
 * browser still has an older Content Studio draft.
 */
export function shouldUseContentDraft(locationHref: string): boolean {
  try {
    return new URL(locationHref).searchParams.get("studio") === "1";
  } catch {
    return false;
  }
}
