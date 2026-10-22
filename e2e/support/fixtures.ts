import { test as base, expect, APIRequestContext, Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
export const apiURL = process.env.CAR_E2E_API_URL!;
export const password = 'Synthetic-E2E-Only-9!';
export const credentials = (role: string) => ({email:`${role.toLowerCase()}@e2e.invalid`,password});
export async function login(request: APIRequestContext, role = 'SUPER_ADMIN') {
  const response = await request.post(apiURL + '/auth/login',{data:credentials(role)}); expect(response.status()).toBe(201); return response.json();
}
export async function browserLogin(page: Page, request: APIRequestContext, role = 'SUPER_ADMIN') {
  const session = await login(request,role);
  await page.addInitScript(({token,user}) => { localStorage.setItem('auth_token',token); localStorage.setItem('auth_user',JSON.stringify(user)); },session);
  return session;
}
export const test = base.extend<{ db: PrismaClient }>({
  page: async ({ page }, use) => {
    // No business API stubs. Block external analytics/images/OAuth/scripts only.
    await page.route('**/*',route => {
      const url = new URL(route.request().url());
      if (['127.0.0.1','localhost','[::1]'].includes(url.hostname) || ['data:','blob:'].includes(url.protocol)) return route.continue();
      return route.abort('blockedbyclient');
    });
    await use(page);
  },
  db: async ({},use) => {
    const {requireTestDatabaseUrl,requireOwnedSchema} = require('../../scripts/lib/test-database.cjs');
    const url = requireTestDatabaseUrl(process.env.CAR_TEST_DATABASE_URL);
    if(url.searchParams.get('schema') !== requireOwnedSchema(process.env.CAR_TEST_DATABASE_SCHEMA))throw new Error('Owned schema required');
    const db = new PrismaClient({datasources:{db:{url:url.toString()}}}); try{await use(db);}finally{await db.$disconnect();}
  },
});
export { expect };
