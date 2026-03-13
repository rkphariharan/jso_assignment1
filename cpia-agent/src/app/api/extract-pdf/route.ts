import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Dynamic import to avoid server bundle issues
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;

    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: { str?: string }) => item.str ?? '').join(' ') + '\n';
    }

    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    console.error('PDF extract error:', err);
    return NextResponse.json({ error: 'Failed to extract PDF text' }, { status: 500 });
  }
}
