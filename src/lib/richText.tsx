import { Link } from "@tanstack/react-router";
import { Fragment, type ReactNode } from "react";

// Matches #hashtag and @mention (letters, numbers, _ and -). Stops at whitespace/punct.
const TOKEN_RE = /([#@])([A-Za-z0-9_\-]{1,40})/g;

export function renderRichText(text: string): ReactNode {
  if (!text) return null;
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    const start = m.index ?? 0;
    if (start > last) out.push(<Fragment key={`t${i++}`}>{text.slice(last, start)}</Fragment>);
    const [, sigil, value] = m;
    const isTag = sigil === "#";
    const search = isTag ? { tag: value.toLowerCase() } : { u: value };
    out.push(
      <Link
        key={`l${i++}`}
        to="/app/community"
        search={search as never}
        className="text-gold hover:underline"
      >
        {sigil}
        {value}
      </Link>,
    );
    last = start + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={`t${i++}`}>{text.slice(last)}</Fragment>);
  return out;
}

export function extractHashtags(text: string): string[] {
  const tags = new Set<string>();
  for (const m of text.matchAll(/#([A-Za-z0-9_\-]{1,40})/g)) tags.add(m[1].toLowerCase());
  return Array.from(tags);
}

export function extractMentions(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/@([A-Za-z0-9_\-]{1,40})/g)) out.add(m[1]);
  return Array.from(out);
}
