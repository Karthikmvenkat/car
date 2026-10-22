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
test('specialist staff dashboard provides a usable authorized landing page',async({page,request})=>{
  await browserLogin(page,request,'SALES_MANAGER');await page.goto('/admin');
  await page.waitForFunction(()=>!!document.querySelector('main [role="alert"]')||Array.from(document.querySelectorAll('main a')).some(a=>a.textContent?.includes('Total inventory')&&/\d/.test(a.textContent)));
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
});
