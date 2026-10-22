import { test, expect, apiURL, browserLogin } from './support/fixtures';
test('quotation request, staff preparation, review and private PDF download', async ({
  page,
  request,
  db,
}, info) => {
  const phone = info.project.name.startsWith('mobile')
    ? '9876500102'
    : '9876500101';
  const email = `quotation-${info.project.name}@e2e.invalid`;
  await page.goto('/configurator?vehicle=e2e-aster');
  await page
    .getByRole('button', { name: 'Request quotation', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Request a quotation' });
  await dialog.getByLabel('Phone number').fill(phone);
  await dialog.getByLabel('Email address').fill(email);
  await dialog.getByLabel(/I agree to be contacted/).check();
  await page.screenshot({
    path: info.outputPath('quotation-customer-popup.png'),
    fullPage: true,
  });
  await dialog
    .getByRole('button', { name: 'Submit quotation request' })
    .click();
  await expect(dialog).toContainText('Our team will contact you soon.');
  const record = await db.quotationRequest.findFirstOrThrow({
    where: { email },
  });
  expect(record.phone).toBe(phone);
  const session = await browserLogin(page, request, 'SALES_MANAGER');
  await page.goto('/admin/quotations');
  await expect(
    page.getByRole('heading', { name: 'Requested quotations' }),
  ).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: email });
  await expect(row).toContainText('Aster');
  await page.screenshot({
    path: info.outputPath('quotation-admin-rows.png'),
    fullPage: true,
  });
  await row.getByRole('button', { name: 'Prepare quotation' }).click();
  await page.getByLabel('Customer name').fill('Synthetic Customer');
  await page.getByLabel('Customer location').fill('Synthetic City');
  await page.getByLabel('Seller name').fill('Synthetic Automotive');
  await page.getByLabel('Seller address').fill('123 Fixture Road, Test City');
  await page.getByLabel('Seller contact').fill('sales@example.invalid');
  await page.getByLabel('Amount INR 1').fill('1000000.50');
  await page
    .getByLabel('Quotation terms')
    .fill(
      'Synthetic quotation. Availability and final terms confirmed personally.',
    );
  await page
    .getByRole('button', { name: 'Review quotation', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Prepare quotation' }),
  ).toContainText('10,00,000.50');
  await page.screenshot({
    path: info.outputPath('quotation-admin-review.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Confirm and create PDF' }).click();
  await expect(page.locator('main').getByRole('status')).toContainText(
    'Quotation revision created',
  );
  await page
    .getByRole('row')
    .filter({ hasText: email })
    .getByRole('button', { name: 'Prepare quotation' })
    .click();
  await expect(page.getByLabel('Amount INR 1')).toHaveValue('1000000.50');
  await page.getByLabel('Customer name').fill('Revised Synthetic Customer');
  await page
    .getByRole('button', { name: 'Review quotation', exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirm and create PDF' }).click();
  await expect(page.getByRole('row').filter({ hasText: email })).toContainText(
    'Revision 2',
  );
  const downloadPromise = page.waitForEvent('download');
  await page
    .getByRole('row')
    .filter({ hasText: email })
    .getByRole('button', { name: 'Download PDF' })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('quotation-');
  expect(await download.failure()).toBeNull();
  const saved = await db.quotationRevision.findFirstOrThrow({
    where: { requestId: record.id },
    orderBy: { number: 'desc' },
  });
  expect(saved.number).toBe(2);
  expect(saved.totalPaise).toBe(100000050);
  expect(saved.pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(
    (
      await request.get(
        `${apiURL}/quotations/${record.id}/revisions/${saved.id}/pdf`,
      )
    ).status(),
  ).toBe(401);
  const response = await request.get(
    `${apiURL}/quotations/${record.id}/revisions/${saved.id}/pdf`,
    { headers: { Authorization: `Bearer ${session.token}` } },
  );
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toContain('no-store');
});

test('quotation popup validates phone and closes with Escape without creating a request', async ({
  page,
  db,
}, info) => {
  const email = `invalid-quotation-${info.project.name}@e2e.invalid`;
  await page.goto('/configurator?vehicle=e2e-aster');
  await page
    .getByRole('button', { name: 'Request quotation', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Request a quotation' });
  await dialog.getByLabel('Phone number').fill('123');
  await dialog.getByLabel('Email address').fill(email);
  await dialog.getByLabel(/I agree to be contacted/).check();
  await dialog
    .getByRole('button', { name: 'Submit quotation request' })
    .click();
  await expect(dialog.getByRole('alert')).toContainText('valid Indian mobile');
  expect(await db.quotationRequest.count({ where: { email } })).toBe(0);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Request quotation', exact: true }),
  ).toBeFocused();
});

test('quotation staff screen denies analysts without fetching customer records', async ({
  page,
  request,
}) => {
  const reads: string[] = [];
  page.on('request', (req) => {
    if (req.url().startsWith(apiURL + '/quotations')) reads.push(req.url());
  });
  await browserLogin(page, request, 'ANALYST');
  await page.goto('/admin/quotations');
  await expect(
    page.getByText('You do not have access to quotation requests.'),
  ).toBeVisible();
  expect(reads).toEqual([]);
  await expect(
    page
      .locator('#admin-sidebar')
      .getByRole('link', {
        name: 'Requested quotations',
        exact: true,
        includeHidden: true,
      }),
  ).toHaveCount(0);
});
