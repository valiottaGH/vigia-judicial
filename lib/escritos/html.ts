import * as cheerio from "cheerio";

export function htmlToPlainParagraphs(html: string): string[] {
  const $ = cheerio.load(html);
  $("script, style").remove();

  const paragraphs: string[] = [];

  $("p, li, h1, h2, h3, h4, br").each((_, el) => {
    const tag = el.type === "tag" ? el.name : "";
    if (tag === "br") {
      paragraphs.push("");
      return;
    }
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) paragraphs.push(text);
  });

  if (paragraphs.length === 0) {
    const fallback = $.root().text().replace(/\s+/g, " ").trim();
    if (fallback) paragraphs.push(fallback);
  }

  return paragraphs;
}
