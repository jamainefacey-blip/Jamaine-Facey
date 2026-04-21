'use strict';

const fs = require('fs');
const path = require('path');

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf8');
  }

  if (ext === '.json') {
    return fs.readFileSync(filePath, 'utf8');
  }

  if (ext === '.pdf') {
    return extractPdf(filePath);
  }

  if (['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'].includes(ext)) {
    return extractOcr(filePath);
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

async function extractPdf(filePath) {
  const pdfParse = require('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  const result = await pdfParse(buffer);
  return result.text;
}

async function extractOcr(filePath) {
  const { createWorker } = require('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: () => {},
    errorHandler: () => {},
  });
  const { data: { text } } = await worker.recognize(filePath);
  await worker.terminate();
  return text;
}

module.exports = { extractText };
