import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import type { TextRunSpec } from "./docx-styles";

export interface HtmlBlock {
  type: "paragraph" | "heading" | "list-item";
  runs: TextRunSpec[];
  level?: 1 | 2 | 3;
}

function collectRuns(
  $: cheerio.CheerioAPI,
  el: AnyNode,
  inherited: Pick<TextRunSpec, "bold" | "italic"> = {}
): TextRunSpec[] {
  const runs: TextRunSpec[] = [];

  if (el.type === "text") {
    const text = (el.data ?? "").replace(/\s+/g, " ");
    if (text.trim()) {
      runs.push({ text, ...inherited });
    }
    return runs;
  }

  if (el.type !== "tag") return runs;

  const tag = el.name.toLowerCase();
  const nextInherited = { ...inherited };

  if (tag === "strong" || tag === "b") nextInherited.bold = true;
  if (tag === "em" || tag === "i") nextInherited.italic = true;

  if (tag === "br") {
    runs.push({ text: "\n", ...inherited });
    return runs;
  }

  for (const child of el.children) {
    runs.push(...collectRuns($, child, nextInherited));
  }

  return runs;
}

function normalizeRuns(runs: TextRunSpec[]): TextRunSpec[] {
  const merged: TextRunSpec[] = [];

  for (const run of runs) {
    const text = run.text.replace(/\u00a0/g, " ");
    if (!text) continue;

    const last = merged[merged.length - 1];
    if (
      last &&
      last.bold === run.bold &&
      last.italic === run.italic &&
      !last.text.endsWith("\n") &&
      !text.startsWith("\n")
    ) {
      last.text += text;
    } else {
      merged.push({ ...run, text });
    }
  }

  return merged
    .map((r) => ({ ...r, text: r.text.trim() }))
    .filter((r) => r.text.length > 0);
}

function blockFromElement(
  $: cheerio.CheerioAPI,
  el: Element
): HtmlBlock | null {
  if (el.type !== "tag") return null;

  const tag = el.name.toLowerCase();
  const runs = normalizeRuns(collectRuns($, el));

  if (runs.length === 0) return null;

  if (tag === "h1") return { type: "heading", level: 1, runs };
  if (tag === "h2") return { type: "heading", level: 2, runs };
  if (tag === "h3") return { type: "heading", level: 3, runs };
  if (tag === "li") return { type: "list-item", runs };
  if (tag === "p" || tag === "div") return { type: "paragraph", runs };

  return null;
}

export function htmlToBlocks(html: string): HtmlBlock[] {
  const $ = cheerio.load(html);
  $("script, style").remove();

  const blocks: HtmlBlock[] = [];

  $("body")
    .children()
    .each((_, el) => {
      const block = blockFromElement($, el);
      if (block) blocks.push(block);
    });

  if (blocks.length === 0) {
    $("p, li, h1, h2, h3, div").each((_, el) => {
      const block = blockFromElement($, el);
      if (block) blocks.push(block);
    });
  }

  if (blocks.length === 0) {
    const fallback = $.root().text().replace(/\s+/g, " ").trim();
    if (fallback) blocks.push({ type: "paragraph", runs: [{ text: fallback }] });
  }

  return blocks;
}

/** @deprecated Usar htmlToBlocks para formato enriquecido. */
export function htmlToPlainParagraphs(html: string): string[] {
  return htmlToBlocks(html).map((block) =>
    block.runs.map((r) => r.text).join("")
  );
}
