import { randomUUID, createHash } from 'node:crypto';
import { test, expect, apiURL, login } from './support/fixtures';
const create = () => ({
  requestKey: randomUUID(),
  vehicleSlug: 'e2e-aster',
  phone: '9876500201',
  email: 'api-quotation@e2e.invalid',
  consent: true,
});
const quotation = () => ({
  expectedVersion: 0,
  reviewed: true,
  customerName: 'Synthetic Customer',
  customerLocation: 'Synthetic City',
  issuerName: 'Synthetic Automotive',
  issuerAddress: '123 Fixture Road',
  issuerContact: 'sales@example.invalid',
  validUntil: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  terms: 'Synthetic test terms. Availability is confirmed personally.',
  items: [
    { label: 'Ex-showroom price', kind: 'CHARGE', amountPaise: 100000050 },
    { label: 'Discount', kind: 'DISCOUNT', amountPaise: 25 },
  ],
});
test('quotation public requests validate, replay, protect contacts and enforce persistent limits', async ({
  request,
  db,
}) => {
  const data = create();
  const post = () => request.post(apiURL + '/quotations', { data });
  const first = await post();
  expect(first.status()).toBe(201);
  const body = await first.json();
  expect(Object.keys(body).sort()).toEqual(['message', 'reference']);
  expect((await (await post()).json()).reference).toBe(body.reference);
  expect(
    await db.quotationRequest.count({ where: { requestKey: data.requestKey } }),
  ).toBe(1);
  expect(
    (
      await (
        await request.post(apiURL + '/quotations', {
          data: { ...data, requestKey: data.requestKey.toUpperCase() },
        })
      ).json()
    ).reference,
  ).toBe(body.reference);
  expect(
    (
      await request.post(apiURL + '/quotations', {
        data: { ...data, email: 'changed@e2e.invalid' },
      })
    ).status(),
  ).toBe(409);
  for (const patch of [
    { consent: 'true' },
    { consent: false },
    { phone: 9876500000 },
    { price: 100 },
    { colourId: 'other-car-colour' },
    { vehicleSlug: 'e2e-unpublished' },
    { vehicleSlug: 'e2e-reserved' },
  ])
    expect(
      (
        await request.post(apiURL + '/quotations', {
          data: { ...data, requestKey: randomUUID(), ...patch },
        })
      ).status(),
    ).toBe(patch.vehicleSlug ? 404 : 400);
  for (let i = 0; i < 4; i++)
    expect(
      (
        await request.post(apiURL + '/quotations', {
          data: { ...data, requestKey: randomUUID() },
        })
      ).status(),
    ).toBe(201);
  expect(
    (
      await request.post(apiURL + '/quotations', {
        data: { ...data, requestKey: randomUUID() },
      })
    ).status(),
  ).toBe(429);
  expect((await post()).status()).toBe(201);
  expect(
    (await request.get(apiURL + '/quotations/' + body.reference)).status(),
  ).toBe(401);
});
for (const role of [
  'SUPER_ADMIN',
  'ADMIN',
  'SALES_MANAGER',
  'INVENTORY_MANAGER',
  'CONTENT_EDITOR',
  'ANALYST',
  'CUSTOMER',
])
  test(`quotation role boundary ${role}`, async ({ request }) => {
    const { token } = await login(request, role);
    const headers = { Authorization: `Bearer ${token}` };
    const allowed = ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(role);
    const response = await request.get(apiURL + '/quotations', { headers });
    expect(response.status()).toBe(allowed ? 200 : 403);
    const id = '00000000-0000-4000-8000-000000000001';
    for (const [path, data] of [
      ['status', { expectedVersion: 0, status: 'CONTACTED' }],
      ['revisions', quotation()],
    ] as const) {
      const response = await request.post(
        `${apiURL}/quotations/${id}/${path}`,
        { headers, data },
      );
      expect(response.status()).toBe(allowed ? 404 : 403);
    }
    expect(
      (
        await request.get(`${apiURL}/quotations/${id}/revisions/${id}/pdf`, {
          headers,
        })
      ).status(),
    ).toBe(allowed ? 404 : 403);
  });
test('quotation reviewed pricing, private PDFs and historical revisions persist', async ({
  request,
  db,
}) => {
  const data = {
    ...create(),
    requestKey: randomUUID(),
    phone: '9876500202',
    email: 'priced-quotation@e2e.invalid',
  };
  const { reference } = await (
    await request.post(apiURL + '/quotations', { data })
  ).json();
  const { token } = await login(request, 'SALES_MANAGER');
  const headers = { Authorization: `Bearer ${token}` };
  for (const patch of [
    { reviewed: false },
    { reviewed: 'true' },
    { expectedVersion: '0' },
    { items: [{ label: 'Car', kind: 'CHARGE', amountPaise: '100' }] },
    { items: [{ label: 'Car', kind: 'CHARGE', amountPaise: 0 }] },
    { totalPaise: 1 },
    { validUntil: '2020-01-01' },
  ])
    expect(
      (
        await request.post(`${apiURL}/quotations/${reference}/revisions`, {
          headers,
          data: { ...quotation(), ...patch },
        })
      ).status(),
    ).toBe(400);
  const created = await request.post(
    `${apiURL}/quotations/${reference}/revisions`,
    { headers, data: quotation() },
  );
  expect(created.status()).toBe(201);
  const result = await created.json();
  expect(result.revision.totalPaise).toBe(100000025);
  expect(result.revision.pdf).toBeUndefined();
  const path = `${apiURL}/quotations/${reference}/revisions/${result.revision.id}/pdf`;
  const pdf = await request.get(path, { headers });
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  expect(pdf.headers()['content-disposition']).toContain('attachment');
  expect(pdf.headers()['cache-control']).toContain('no-store');
  expect(pdf.headers()['x-content-type-options']).toBe('nosniff');
  const bytes = await pdf.body();
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(
    (
      await request.post(`${apiURL}/quotations/${reference}/revisions`, {
        headers,
        data: quotation(),
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post(`${apiURL}/quotations/${reference}/revisions`, {
        headers,
        data: {
          ...quotation(),
          expectedVersion: 1,
          customerName: 'Second Customer Name',
        },
      })
    ).status(),
  ).toBe(201);
  expect(
    (await (await request.get(path, { headers })).body()).equals(bytes),
  ).toBe(true);
  expect(
    (
      await db.quotationRevision.findUniqueOrThrow({
        where: { id: result.revision.id },
      })
    ).sha256,
  ).toBe(createHash('sha256').update(bytes).digest('hex'));
  expect(
    (await request.get(apiURL + '/quotations?limit=51', { headers })).status(),
  ).toBe(400);
});
