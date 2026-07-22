declare module "word-extractor" {
  interface ExtractedDocument {
    getBody(): string;
    getHeaders(options?: { includeFooters?: boolean }): string;
    getFootnotes(): string;
    getEndnotes(): string;
    getAnnotations(): string;
    getTextboxes(options?: { includeHeadersAndFooters?: boolean }): string;
  }

  export default class WordExtractor {
    extract(input: string | Buffer): Promise<ExtractedDocument>;
  }
}
