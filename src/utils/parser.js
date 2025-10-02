import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Extract text from PDF file
export async function extractTextFromPDF(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async function () {
      try {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let textContent = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item) => item.str);
          textContent += strings.join(' ') + '\n';
        }

        resolve(textContent);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// Extract name, email, and phone from text
export function extractNameEmailPhone(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
  const phoneMatch = text.match(/(\+?\d{1,3}[\s-]?)?\d{10}/);

  let name = '';
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine && /^[A-Za-z\s]+$/.test(firstLine) && firstLine.split(' ').length >= 2) {
      name = firstLine;
    }
  }

  return {
    name: name || '',
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
  };
}








