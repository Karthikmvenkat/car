import { test,expect,password,browserLogin } from './support/fixtures';
test('staff login opens dashboard and inventory from real session',async({page})=>{
  await page.goto('/admin/login');await page.getByPlaceholder('admin@car.com').fill('super_admin@e2e.invalid');await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button',{name:/Sign In/i}).click();await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading',{name:/Welcome back/})).toBeVisible();await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
  await page.goto('/admin/vehicles');await expect(page.getByText('Aster').first()).toBeVisible();
});
test('customer account cannot enter staff workspace',async({page})=>{
  await page.goto('/admin/login');await page.getByPlaceholder('admin@car.com').fill('customer@e2e.invalid');await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button',{name:/Sign In/i}).click();await expect(page.getByText('This account does not have admin access.')).toBeVisible();
});
for(const role of ['SALES_MANAGER','INVENTORY_MANAGER','CONTENT_EDITOR','ANALYST'])test(`specialist staff dashboard provides a usable authorized landing page ${role}`,async({page,request})=>{
  const failures:string[]=[];page.on('response',response=>{if(response.url().includes('/api/')&&response.status()>=400)failures.push(response.url());});
  await browserLogin(page,request,role);await page.goto('/admin');
  await expect(page.getByRole('heading',{name:/Welcome back/})).toBeVisible();
  if(role==='SALES_MANAGER')await expect(page.locator('main a').filter({hasText:'Customer enquiries'})).toContainText(/\d/);
  if(role==='INVENTORY_MANAGER')await expect(page.locator('main a').filter({hasText:'Total inventory'})).toContainText(/\d/);
  if(role==='CONTENT_EDITOR')await expect(page.getByRole('link',{name:/Manage content/})).toBeVisible();
  await expect(page.getByRole('link',{name:/Open the storefront/})).toBeVisible();
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
  expect(failures).toEqual([]);
});
