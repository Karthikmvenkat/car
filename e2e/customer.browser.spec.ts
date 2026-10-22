import { test, expect, apiURL, browserLogin, password } from './support/fixtures';

test('published discovery, search and empty results', async ({page}) => {
  await page.goto('/vehicles'); await expect(page.getByRole('heading',{name:'Browse Vehicles'})).toBeVisible();
  await expect(page.getByRole('heading',{name:/E2E Motors Aster/})).toBeVisible();
  await expect(page.getByRole('heading',{name:/Unpublished|Reserved/})).toHaveCount(0);
  await page.getByLabel('Search vehicles').fill('Boreal'); await page.getByLabel('Search vehicles').press('Enter');
  await expect(page.getByRole('heading',{name:/E2E Motors Boreal/})).toBeVisible();
  await expect(page.getByRole('heading',{name:/E2E Motors Aster/})).toHaveCount(0);
  await page.getByLabel('Search vehicles').fill('NoSuchSyntheticCar'); await page.getByLabel('Search vehicles').press('Enter');
  await expect(page.getByRole('heading',{name:/No vehicles found/i})).toBeVisible();
});

test('filters and sorting preserve real inventory', async ({page}) => {
  await page.goto('/vehicles');
  await page.getByLabel('Filter by fuel').selectOption('Electric');
  await page.getByLabel('Sort vehicles').selectOption('price-desc');
  await expect(page.getByRole('heading',{name:/E2E Motors Aster/})).toBeVisible();
  await expect(page.getByRole('heading',{name:/E2E Motors Boreal/})).toHaveCount(0);
  const names = await page.locator('.vehicle-grid h3').allTextContents(); expect(names[0]).toContain('Cedar');
});

test('saved vehicles survive reload and can be removed', async ({page}) => {
  await page.goto('/vehicles'); await page.getByRole('button',{name:'Save E2E Motors Aster',exact:true}).click();
  await page.goto('/favorites'); await expect(page.getByRole('heading',{name:/E2E Motors Aster/})).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading',{name:/E2E Motors Aster/})).toBeVisible();
  await page.getByRole('button',{name:'Remove E2E Motors Aster from saved',exact:true}).click();
  await expect(page.getByRole('heading',{name:/E2E Motors Aster/})).toHaveCount(0);
});

test('compare three vehicles and prevent duplicate selections', async ({page}) => {
  await page.goto('/compare'); await page.getByLabel('CAR 1').selectOption('e2e-car-0');
  await page.getByLabel('CAR 2').selectOption('e2e-car-1'); await page.getByLabel('CAR 3').selectOption('e2e-car-2');
  await expect(page.getByRole('table',{name:'Selected vehicle comparison'})).toContainText('E2E Motors Aster');
  await expect(page.getByRole('table')).toContainText('E2E Motors Boreal');
  await expect(page.getByLabel('CAR 2').locator('option[value="e2e-car-0"]')).toHaveJSProperty('disabled',true);
});

test('configurator colors, specifications, gallery and persisted share link', async ({page,request,db}) => {
  await page.goto('/configurator?vehicle=e2e-aster');
  await expect(page.getByRole('heading',{name:/Aster/}).first()).toBeVisible();
  await page.getByRole('button',{name:/Ocean Blue metallic/}).click(); await expect(page.getByRole('button',{name:/Ocean Blue metallic/})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('tab',{name:'Key Specifications'}).click(); await expect(page.getByRole('tabpanel')).toContainText('400');
  await page.getByRole('tab',{name:'Features',exact:true}).click(); await expect(page.getByRole('tabpanel')).toContainText('Synthetic parking sensor');
  await page.getByRole('tab',{name:'Gallery',exact:true}).click();
  await page.getByRole('button',{name:'Expand vehicle photo'}).click(); await expect(page.getByRole('dialog',{name:'Vehicle photo'})).toBeVisible();
  await page.getByRole('button',{name:'Close photo'}).click();
  await page.getByRole('button',{name:/Save Configuration/}).click(); await expect(page.getByRole('status')).toContainText('Configuration saved');
  const shared = await page.getByLabel('Share link').inputValue(); const token = new URL(shared).searchParams.get('config');
  expect(token).toBeTruthy();
  const record = await db.savedConfiguration.findUnique({where:{shareToken:token!}}); expect(record?.selectedColour).toBe('Ocean Blue');
  const response = await request.get(apiURL+'/configurator/configurations/'+token); expect(response.status()).toBe(200);
  await page.goto(shared); await expect(page.getByRole('button',{name:/Ocean Blue metallic/})).toHaveAttribute('aria-pressed','true');
});

test('email registration persists customer role and session', async ({page,db},info) => {
  const email=`registered-${info.project.name}@e2e.invalid`;
  await page.goto('/register');
  await page.getByLabel('First Name').fill('Synthetic'); await page.getByLabel('Last Name').fill('Customer');
  await page.getByLabel('Email Address').fill(email); await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByLabel('Confirm Password').fill(password); await page.locator('input[name="agreeToTerms"]').check();
  await page.getByRole('button',{name:/Create Account/i}).click(); await expect(page).toHaveURL(process.env.CAR_E2E_WEB_URL!+'/');
  expect((await db.user.findUnique({where:{email}}))?.role).toBe('CUSTOMER');
  await page.goto('/profile'); await expect(page.getByRole('heading',{name:'My Profile'})).toBeVisible();
});

test('invalid login, successful login, reload, profile edit and logout', async ({page,db},info) => {
  await page.goto('/signin'); await page.getByLabel('Email Address').fill('customer@e2e.invalid');
  await page.getByLabel('Password',{exact:true}).fill('incorrect-test-password'); await page.getByRole('button',{name:'Sign In',exact:true}).click();
  await expect(page.locator('main').getByRole('alert')).toBeVisible();
  await page.getByLabel('Password',{exact:true}).fill(password); await page.getByRole('button',{name:'Sign In',exact:true}).click(); await expect(page).toHaveURL(process.env.CAR_E2E_WEB_URL!+'/');
  await page.goto('/profile'); await page.reload(); await expect(page.getByRole('heading',{name:'My Profile'})).toBeVisible();
  await page.getByRole('button',{name:'Edit',exact:true}).click();
  const name=`Customer ${info.project.name}`; await page.getByLabel('Full Name').fill(name); await page.getByLabel('Phone Number').fill('9000000000');
  await page.getByRole('button',{name:/Save Changes/i}).click(); await expect(page.getByText('Profile updated successfully')).toBeVisible();
  expect((await db.user.findUnique({where:{id:'e2e-customer'}}))?.name).toBe(name);
  if(info.project.name.startsWith('mobile'))await page.getByRole('button',{name:'Open menu'}).click(); else await page.locator('summary').filter({hasText:'My account'}).click();
  await page.getByRole('button',{name:'Sign out',exact:true}).click(); await page.goto('/profile'); await expect(page).toHaveURL(/\/signin/);
});

for(const booking of [false,true])test(`${booking?'test drive':'enquiry'} submission persists and staff updates status`,async({page,request,db},info)=>{
  const name=`E2E ${booking?'Drive':'Lead'} ${info.project.name}`;
  await page.goto((booking?'/test-drive':'/enquire')+'?vehicle=e2e-aster');
  await page.getByLabel('Your name',{exact:true}).fill(name); await page.getByLabel('Email',{exact:true}).fill(`lead-${info.project.name}@e2e.invalid`);
  await page.getByLabel('Phone',{exact:true}).fill('9000000000');
  if(booking){await page.getByLabel('Preferred date').fill(new Date(Date.now()+3*86400000).toISOString().slice(0,10));await page.getByLabel('Preferred time').selectOption('10:00 AM');}
  else await page.getByLabel('Your message').fill('Synthetic availability request.');
  await page.getByRole('button',{name:booking?'Request a test drive':'Send enquiry',exact:true}).click();
  await expect(page.getByRole('heading',{name:booking?'Test drive requested':'Enquiry received'})).toBeVisible();
  const record=booking?await db.testDriveBooking.findFirst({where:{name}}):await db.enquiry.findFirst({where:{name}}); expect(record).toBeTruthy();
  await browserLogin(page,request,'SALES_MANAGER'); await page.goto(booking?'/admin/bookings':'/admin/enquiries');
  await page.getByLabel(`Status for ${name}`).selectOption(booking?'CONFIRMED':'CONTACTED');
  await expect(page.getByLabel(`Status for ${name}`)).toHaveValue(booking?'CONFIRMED':'CONTACTED');
  await expect.poll(async()=>booking?(await db.testDriveBooking.findUnique({where:{id:record!.id}}))?.status:(await db.enquiry.findUnique({where:{id:record!.id}}))?.status).toBe(booking?'CONFIRMED':'CONTACTED');
});

test('finance computes a deterministic zero-interest EMI and validates budget',async({page})=>{
  await page.goto('/finance'); await page.getByLabel('Car price (₹)',{exact:true}).fill('1000000');await page.getByLabel('Down payment (₹)',{exact:true}).fill('200000');
  await page.getByLabel('Annual interest rate (%)').fill('0');await page.getByLabel('Loan tenure (months)').fill('40');
  await expect(page.locator('[aria-live="polite"]')).toContainText('20,000');
  await page.getByLabel('Down payment (₹)',{exact:true}).fill('2000000');await expect(page.locator('main').getByRole('alert')).toBeVisible();
});

test('password reset honestly reports disconnected delivery',async({page})=>{
  await page.goto('/forgot-password');await page.getByLabel('Email Address').fill('nobody@e2e.invalid');await page.getByRole('button',{name:/Send Reset Link/i}).click();
  await expect(page.getByText(/No reset email has been sent/)).toBeVisible();
});

test('internally stored configurator photo actually decodes in the browser',async({page})=>{
  await page.goto('/configurator?vehicle=e2e-aster');
  const photo=page.locator('img.gallery-image');await expect(photo).toBeVisible();
  await expect.poll(()=>photo.evaluate(image=>(image as HTMLImageElement).naturalWidth),{message:'Stored API photo must load, not only reserve an image box'}).toBeGreaterThan(0);
});

test('filter and sort work after each navigation settles',async({page})=>{
  await page.goto('/vehicles');await page.getByLabel('Filter by fuel').selectOption('Electric');
  await expect(page).toHaveURL(/fuelType=Electric/);await expect(page.getByRole('heading',{name:/E2E Motors Boreal/})).toHaveCount(0);
  await page.getByLabel('Sort vehicles').selectOption('price-desc');await expect(page).toHaveURL(/sortBy=price-desc/);
  await expect(page.getByRole('heading',{name:/E2E Motors Boreal/})).toHaveCount(0);
  await expect(page.locator('.vehicle-grid h3').first()).toContainText('Cedar');
});
