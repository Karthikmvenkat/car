import { BadRequestException } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { openSync } from 'fontkit';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CreateQuotationRevisionDto } from './quotations.dto';

export const MAX_TOTAL = 2_000_000_000;
export function quotationTotal(items: CreateQuotationRevisionDto['items']) {
  let charges = 0,
    discounts = 0;
  for (const item of items) {
    if (
      !Number.isSafeInteger(item.amountPaise) ||
      item.amountPaise < 0 ||
      item.amountPaise > MAX_TOTAL
    )
      throw new BadRequestException('Invalid quotation amount');
    if (item.kind === 'CHARGE') charges += item.amountPaise;
    else if (item.kind === 'DISCOUNT') discounts += item.amountPaise;
    else throw new BadRequestException('Invalid quotation item');
  }
  if (
    !items.length ||
    items.length > 20 ||
    charges > MAX_TOTAL ||
    discounts >= charges
  )
    throw new BadRequestException(
      'Charges must exceed discounts and the total must be within INR 2 crore',
    );
  return {
    chargesPaise: charges,
    discountsPaise: discounts,
    totalPaise: charges - discounts,
  };
}
export const money = (paise: number) =>
  'INR ' +
  (paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export interface QuoteSnapshot extends Omit<
  CreateQuotationRevisionDto,
  'expectedVersion' | 'reviewed'
> {
  templateVersion: number;
  currency: 'INR';
  reference: string;
  number: number;
  issuedAt: string;
  vehicle: { title: string; variant: string; colour: string; slug: string };
  phone: string;
  email: string;
  chargesPaise: number;
  discountsPaise: number;
  totalPaise: number;
}
let fontPath: string | undefined;
function quotationFont() {
  if (!fontPath)
    fontPath = [
      resolve(__dirname, '../../../assets/fonts/NotoSans-Regular.ttf'),
      resolve(process.cwd(), 'assets/fonts/NotoSans-Regular.ttf'),
    ].find(existsSync);
  if (!fontPath) throw new Error('Quotation font is not packaged');
  return fontPath;
}
export async function renderQuotation(
  snapshot: QuoteSnapshot,
): Promise<Buffer> {
  const font = quotationFont();
  const face = openSync(font);
  if (!('hasGlyphForCodePoint' in face))
    throw new Error('Invalid quotation font');
  const fields = [
    snapshot.customerName,
    snapshot.customerLocation,
    snapshot.issuerName,
    snapshot.issuerAddress,
    snapshot.issuerContact,
    snapshot.phone,
    snapshot.email,
    snapshot.vehicle.title,
    snapshot.vehicle.variant,
    snapshot.vehicle.colour,
    snapshot.deliveryEstimate ?? '',
    snapshot.terms,
    ...snapshot.items.flatMap((i) => [i.label, i.note ?? '']),
  ];
  for (const text of fields)
    for (const char of text)
      if (
        !/[\r\n\t]/.test(char) &&
        !face.hasGlyphForCodePoint(char.codePointAt(0)!)
      )
        throw new BadRequestException(
          'Quotation contains unsupported characters. Use an English transliteration for this document.',
        );
  const doc = new PDFDocument({
    size: 'A4',
    margin: 44,
    bufferPages: true,
    info: { Title: 'CarPal price quotation', Author: snapshot.issuerName },
  });
  const chunks: Buffer[] = [];
  let bytes = 0;
  const complete = new Promise<Buffer>((res, rej) => {
    doc.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 2 * 1024 * 1024)
        doc.destroy(new Error('Quotation exceeds PDF size limit'));
      else chunks.push(chunk);
    });
    doc.on('end', () => res(Buffer.concat(chunks)));
    doc.on('error', rej);
  });
  doc.font(font);
  let y = 44;
  const width = doc.page.width - 88;
  const header = () => {
    doc.fillColor('#2864ff').fontSize(23).text('CarPal', 44, 38);
    doc.fillColor('#10243a').fontSize(13).text('PRICE QUOTATION', 44, 72);
    doc
      .fontSize(8)
      .fillColor('#64748b')
      .text(`${snapshot.reference} / Revision ${snapshot.number}`, 44, 94, {
        width,
      });
    doc
      .moveTo(44, 114)
      .lineTo(doc.page.width - 44, 114)
      .strokeColor('#e2e8f0')
      .stroke();
    y = 130;
  };
  const ensure = (height: number) => {
    if (y + height > doc.page.height - 65) {
      doc.addPage();
      header();
    }
  };
  const text = (value: string, size = 10, color = '#10243a') => {
    doc.fontSize(size);
    const h = doc.heightOfString(value, { width, lineGap: 3 });
    if (h > doc.page.height - 200) {
      let rest = value;
      while (rest.length) {
        const boundary = rest.length > 400 ? rest.lastIndexOf(' ', 400) : -1;
        const end =
          rest.length <= 400 ? rest.length : boundary > 200 ? boundary : 400;
        text(rest.slice(0, end), size, color);
        rest = rest.slice(end).trimStart();
      }
      return;
    }
    ensure(h + 10);
    doc
      .fontSize(size)
      .fillColor(color)
      .text(value, 44, y, { width, lineGap: 3 });
    y += h + 10;
  };
  header();
  text(
    `${snapshot.issuerName}\n${snapshot.issuerAddress}\n${snapshot.issuerContact}`,
    9,
  );
  text(
    `Issued: ${snapshot.issuedAt.slice(0, 10)}    Valid through: ${snapshot.validUntil}`,
    9,
    '#64748b',
  );
  text(
    `Prepared for ${snapshot.customerName}\n${snapshot.customerLocation}\n${snapshot.phone} | ${snapshot.email}`,
    10,
  );
  text(
    [snapshot.vehicle.title, snapshot.vehicle.variant, snapshot.vehicle.colour]
      .filter(Boolean)
      .join(' | '),
    12,
  );
  if (snapshot.deliveryEstimate)
    text('Estimated delivery: ' + snapshot.deliveryEstimate, 9);
  text('PRICE BREAKDOWN', 11);
  for (const item of snapshot.items) {
    const label = item.label + (item.note ? '\n' + item.note : '');
    doc.fontSize(9);
    const h = Math.max(
      20,
      doc.heightOfString(label, { width: width - 140, lineGap: 3 }) + 14,
    );
    ensure(h);
    doc
      .fontSize(9)
      .fillColor('#10243a')
      .text(label, 44, y, { width: width - 140, lineGap: 3 });
    doc.text(
      (item.kind === 'DISCOUNT' ? '- ' : '') + money(item.amountPaise),
      doc.page.width - 180,
      y,
      { width: 136, align: 'right' },
    );
    y += h;
    doc
      .moveTo(44, y - 5)
      .lineTo(doc.page.width - 44, y - 5)
      .strokeColor('#e2e8f0')
      .stroke();
  }
  text('TOTAL CARPAL PRICE: ' + money(snapshot.totalPaise), 14, '#2864ff');
  doc.fontSize(9);
  ensure(
    Math.min(
      doc.heightOfString(snapshot.terms, { width, lineGap: 3 }) + 50,
      doc.page.height - 200,
    ),
  );
  text('PLEASE NOTE', 11);
  text(snapshot.terms, 9, '#475569');
  text(
    'This quotation is subject to its stated validity and terms. It does not reserve stock or confirm vehicle availability.',
    8,
    '#64748b',
  );
  const pages = doc.bufferedPageRange();
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .fillColor('#64748b')
      .text(
        `CarPal | Quotation revision ${snapshot.number} | Page ${i + 1} of ${pages.count}`,
        44,
        doc.page.height - 56,
        { width, align: 'center', lineBreak: false },
      );
  }
  doc.end();
  return complete;
}
