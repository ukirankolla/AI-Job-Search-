declare module "word-extractor" {
  interface ExtractedDocument {
    getBody(): string;
  }

  export default class WordExtractor {
    extract(buffer: ArrayBuffer | Uint8Array): Promise<ExtractedDocument>;
  }
}
