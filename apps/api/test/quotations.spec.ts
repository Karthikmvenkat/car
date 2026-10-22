import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { randomUUID } from 'node:crypto';
import {
  CreateQuotationDto,
  CreateQuotationRevisionDto,
} from '../src/modules/quotations/quotations.dto';
import { quotationTotal } from '../src/modules/quotations/quotation-pdf';
const request = () => ({
  requestKey: randomUUID(),
  vehicleSlug: 'synthetic-car',
  phone: '9876500001',
  email: 'quotation@example.invalid',
  consent: true,
});
const errors = (value: unknown) =>
  validate(
    plainToInstance(CreateQuotationDto, value, {
      enableImplicitConversion: true,
    }),
    { whitelist: true, forbidNonWhitelisted: true },
  );
describe('Quotation input and exact money rules', () => {
  it('accepts required contacts and explicit boolean consent', async () =>
    expect(await errors(request())).toHaveLength(0));
  it.each([
    { consent: 'true' },
    { consent: false },
    { phone: 9876500001 },
    { email: {} },
    { price: 100 },
    { userId: 'customer' },
    { phone: '123' },
    { requestKey: 'not-a-uuid' },
  ])(
    'rejects coercion, invalid contact and unauthorized fields %j',
    async (patch) =>
      expect((await errors({ ...request(), ...patch })).length).toBeGreaterThan(
        0,
      ),
  );
  it('calculates paise, including discounts, without floating point price arithmetic', () =>
    expect(
      quotationTotal([
        { label: 'Car', kind: 'CHARGE', amountPaise: 100050 },
        { label: 'Discount', kind: 'DISCOUNT', amountPaise: 25 },
      ]),
    ).toEqual({
      chargesPaise: 100050,
      discountsPaise: 25,
      totalPaise: 100025,
    }));
  it.each([0, -1, 1.25, Number.MAX_SAFE_INTEGER, 2000000001])(
    'rejects invalid final/line amount %s',
    (amount) =>
      expect(() =>
        quotationTotal([{ label: 'Car', kind: 'CHARGE', amountPaise: amount }]),
      ).toThrow(),
  );
  it('rejects over-discount, aggregate cap, excess rows and unknown kind', () => {
    for (const items of [
      [
        { kind: 'CHARGE', amountPaise: 100 },
        { kind: 'DISCOUNT', amountPaise: 101 },
      ],
      [
        { kind: 'CHARGE', amountPaise: 2000000000 },
        { kind: 'CHARGE', amountPaise: 1 },
      ],
      Array.from({ length: 21 }, () => ({ kind: 'CHARGE', amountPaise: 1 })),
      [{ kind: 'OTHER', amountPaise: 100 }],
    ])
      expect(() => quotationTotal(items as any)).toThrow();
  });
  it('does not coerce a reviewed flag or nested amount', async () => {
    const dto = plainToInstance(
      CreateQuotationRevisionDto,
      {
        expectedVersion: '0',
        reviewed: 'true',
        items: [{ label: 'Car', kind: 'CHARGE', amountPaise: '100' }],
      },
      { enableImplicitConversion: true },
    );
    const result = await validate(dto);
    expect(result.map((x) => x.property)).toEqual(
      expect.arrayContaining(['expectedVersion', 'reviewed', 'items']),
    );
  });
});
