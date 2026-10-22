import { test,expect,browserLogin } from './support/fixtures';
const publicRoutes=['/','/vehicles','/vehicles/e2e-aster','/about','/how-it-works','/faq','/contact','/sell','/finance','/stories','/get-started','/terms','/privacy','/signin','/register','/forgot-password','/favorites','/compare','/enquire','/test-drive'];
for(const route of publicRoutes)test(`route smoke ${route}`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto(route);expect(response?.status()).toBe(200);await expect(page.locator('main h1').first()).toBeVisible();expect(errors).toEqual([]);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);expect(overflow,'unexpected horizontal page overflow').toBe(false);
});
test('unknown route has a real not-found state',async({page})=>{const response=await page.goto('/e2e-route-does-not-exist');expect(response?.status()).toBe(404);});
test('empty configurator explains missing vehicle',async({page})=>{await page.goto('/configurator');await expect(page.locator('main')).toContainText('No vehicle specified');});
test('anonymous admin and profile require login',async({page})=>{await page.goto('/admin/vehicles');await expect(page).toHaveURL(/\/admin\/login/);await page.goto('/profile');await expect(page).toHaveURL(/\/signin/);});
const adminRoutes=['/admin','/admin/vehicles','/admin/vehicles/new','/admin/vehicles/pipeline','/admin/3d-library','/admin/enquiries','/admin/bookings','/admin/users','/admin/customers','/admin/brands','/admin/faqs','/admin/testimonials','/admin/content','/admin/settings'];
for(const route of adminRoutes)test(`staff route smoke ${route}`,async({page,request})=>{
  await browserLogin(page,request);const target=route==='/admin/vehicles/pipeline'?route+'?id=e2e-car-0':route;
  const response=await page.goto(target);expect(response?.status()).toBe(200);
  await expect(page.locator('main h1').first()).toBeVisible();await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
});
