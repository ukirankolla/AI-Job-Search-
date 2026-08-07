import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { extractResumeText } from "@/lib/resume-extract";

function fileFrom(name: string, data: Uint8Array, type: string): File {
  return new File([Buffer.from(data)], name, { type });
}

const minimalPdf = Buffer.from(
  `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 55 >>
stream
BT /F1 24 Tf 100 700 Td (Hello Resume World) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
trailer
<< /Size 6 /Root 1 0 R >>
%%EOF
`,
  "latin1",
);

async function makeDocx(text: string): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>${text}</w:t></w:r></w:p>
  </w:body>
</w:document>`,
  );
  return zip.generateAsync({ type: "uint8array" });
}

describe("extractResumeText", () => {
  it("extracts text from a PDF", async () => {
    const text = await extractResumeText(
      fileFrom("resume.pdf", minimalPdf, "application/pdf"),
    );
    expect(text).toContain("Hello Resume World");
  });

  it("extracts text from a .docx", async () => {
    const docx = await makeDocx("Hello Resume Word");
    const text = await extractResumeText(
      fileFrom(
        "resume.docx",
        docx,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    );
    expect(text).toContain("Hello Resume Word");
  });

  it("extracts text from a .doc via word-extractor", async () => {
    const doc = await makeDocx("Hello Resume Old Doc");
    const text = await extractResumeText(
      fileFrom("resume.doc", doc, "application/msword"),
    );
    expect(text).toContain("Hello Resume Old Doc");
  });

  it("extracts text from a .txt", async () => {
    const text = await extractResumeText(
      fileFrom("resume.txt", Buffer.from("Hello Resume Text"), "text/plain"),
    );
    expect(text).toContain("Hello Resume Text");
  });

  it("rejects unsupported file types", async () => {
    await expect(
      extractResumeText(fileFrom("resume.rtf", Buffer.from("x"), "application/rtf")),
    ).rejects.toThrow(/Unsupported file type/);
  });
});
