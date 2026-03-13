import { NextRequest, NextResponse } from 'next/server';

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function decodeUtf8(uint8Array: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const lowerName = file.name.toLowerCase();
    const mimeType = (file.type || '').toLowerCase();

    const isPdf = mimeType === 'application/pdf' || lowerName.endsWith('.pdf');
    const isTxt = mimeType.startsWith('text/') || lowerName.endsWith('.txt');
    const isDocx =
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      lowerName.endsWith('.docx');
    const isDoc = mimeType === 'application/msword' || lowerName.endsWith('.doc');

    if (isDoc) {
      return NextResponse.json(
        { error: 'Legacy .doc files are not supported. Please upload .pdf, .docx, .txt, or paste text.' },
        { status: 400 },
      );
    }

    if (isTxt) {
      const text = normalizeWhitespace(new TextDecoder('utf-8').decode(uint8Array));
      if (!text) return NextResponse.json({ error: 'No readable text found in this file.' }, { status: 400 });
      return NextResponse.json({ text });
    }

    if (isDocx) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = normalizeWhitespace(result.value || '');
      if (!text) return NextResponse.json({ error: 'No readable text found in this DOCX file.' }, { status: 400 });
      return NextResponse.json({ text });
    }

    if (!isPdf) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload .pdf, .docx, .txt, or paste text.' },
        { status: 400 },
      );
    }

    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;

      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text +=
          content.items
            .map((item: { str?: string } | Record<string, unknown>) => ('str' in item ? item.str ?? '' : ''))
            .join(' ') + '\n';
      }

      const normalizedText = normalizeWhitespace(text);
      if (normalizedText) {
        return NextResponse.json({ text: normalizedText });
      }
    } catch (pdfErr) {
      console.warn('PDF parsing fallback used:', pdfErr);
    }

    const decoded = normalizeWhitespace(decodeUtf8(uint8Array));
    if (decoded.length >= 80) {
      return NextResponse.json({ text: decoded });
    }

    return NextResponse.json(
      {
        error:
          'Could not read this PDF content. Please upload a text-based PDF, use DOCX/TXT, or paste your resume text directly.',
      },
      { status: 400 },
    );
  } catch (err) {
    console.error('PDF extract error:', err);
    return NextResponse.json({ error: 'Failed to extract resume text' }, { status: 500 });
  }
}
