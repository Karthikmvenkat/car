import { test,expect,apiURL,login,credentials,password } from './support/fixtures';
const headers=(token:string)=>({Authorization:`Bearer ${token}`});

test('public inventory and configuration enforce publication boundaries',async({request})=>{
  const response=await request.get(apiURL+'/vehicles');expect(response.status()).toBe(200);const body=await response.json();expect(body.pagination.total).toBe(3);
  const published=await request.get(apiURL+'/configurator/vehicles');const cars=await published.json();expect(cars).toHaveLength(3);expect(cars.map((v:any)=>v.slug)).not.toContain('e2e-unpublished');
  for(const slug of ['e2e-unpublished','e2e-reserved']){
    expect((await request.get(apiURL+'/vehicles/'+slug)).status()).toBe(404);
    expect((await request.get(apiURL+'/configurator/vehicles/'+slug)).status()).toBe(404);
    expect((await request.post(apiURL+'/configurator/configurations',{data:{vehicleSlug:slug}})).status()).toBe(404);
  }
  expect((await request.get(apiURL+'/vehicles?limit=51')).status()).toBe(400);
});

for(const role of ['SUPER_ADMIN','ADMIN','INVENTORY_MANAGER','SALES_MANAGER','CONTENT_EDITOR','ANALYST','CUSTOMER'])test(`role matrix ${role}`,async({request})=>{
  const {token}=await login(request,role);const h=headers(token);
  for(const [endpoint,allowed]of [
    ['/vehicles/all',['SUPER_ADMIN','ADMIN','INVENTORY_MANAGER']],['/enquiries',['SUPER_ADMIN','ADMIN','SALES_MANAGER']],['/bookings',['SUPER_ADMIN','ADMIN','SALES_MANAGER']],
    ['/users',['SUPER_ADMIN','ADMIN']],['/catalog-intake/sources',['SUPER_ADMIN','ADMIN','INVENTORY_MANAGER']],['/catalog-media/candidates/missing/images',['SUPER_ADMIN','ADMIN','INVENTORY_MANAGER']],
  ]as const)expect((await request.get(apiURL+endpoint,{headers:h})).status(),endpoint).toBe((allowed as readonly string[]).includes(role)?200:403);
  const faq=await request.post(apiURL+'/content/faqs',{headers:h,data:{question:`Role ${role} question`,answer:'Synthetic',category:'Role'}});
  expect(faq.status()).toBe(['SUPER_ADMIN','ADMIN','CONTENT_EDITOR'].includes(role)?201:403);
});

test('anonymous staff routes deny access',async({request})=>{for(const path of ['/vehicles/all','/users','/enquiries','/bookings','/admin/configurator/vehicles','/catalog-intake/sources','/catalog-media/candidates/x/images'])expect((await request.get(apiURL+path)).status()).toBe(401);});

test('registration, duplicate email and invalid credentials',async({request,db})=>{
  const data={name:'Synthetic API User',email:'api-user@e2e.invalid',password};
  const response=await request.post(apiURL+'/auth/register',{data});expect(response.status()).toBe(201);const session=await response.json();expect(session.user.role).toBe('CUSTOMER');
  expect((await request.post(apiURL+'/auth/register',{data})).status()).toBe(409);
  expect((await request.post(apiURL+'/auth/login',{data:{...credentials('CUSTOMER'),password:'wrong-password'}})).status()).toBe(401);
  expect((await db.user.findUnique({where:{email:data.email}}))?.passwordHash).not.toBe(password);
});

test('brand/model CRUD persists independently of vehicle creation',async({request})=>{
  const {token}=await login(request,'INVENTORY_MANAGER');const h=headers(token);
  const brandResponse=await request.post(apiURL+'/brands',{headers:h,data:{name:'Synthetic CRUD Brand',slug:'synthetic-crud'}});expect(brandResponse.status()).toBe(201);const brand=await brandResponse.json();
  const modelResponse=await request.post(apiURL+`/brands/${brand.id}/models`,{headers:h,data:{name:'Synthetic CRUD Model',slug:'crud-model'}});expect(modelResponse.status()).toBe(201);const model=await modelResponse.json();
  expect((await request.put(apiURL+'/brands/'+brand.id,{headers:h,data:{name:'Updated Synthetic Brand'}})).status()).toBe(200);
  expect((await request.delete(apiURL+'/brands/models/'+model.id,{headers:h})).status()).toBe(200);
  expect((await request.delete(apiURL+'/brands/'+brand.id,{headers:h})).status()).toBe(200);
});

test('legacy vehicle creation accepts a valid existing brand/model',async({request})=>{
  const {token}=await login(request,'INVENTORY_MANAGER');const h=headers(token);
  const created=await request.post(apiURL+'/vehicles',{headers:h,data:{brandSlug:'e2e-motors',modelSlug:'aster',variant:'Create test',year:2027,condition:'NEW',price:1100000,currency:'INR',bodyStyle:'SUV',fuelType:'Electric',transmission:'Automatic'}});
  expect(created.status()).toBe(201);
  const car=await created.json();expect(car.currency).toBe('INR');
  expect((await request.delete(apiURL+'/vehicles/'+car.id,{headers:h})).status()).toBe(200);
});

test('legacy vehicle update/delete persists independently of create',async({request,db})=>{
  const {token}=await login(request,'INVENTORY_MANAGER');const h=headers(token);
  const car=await db.vehicle.create({data:{slug:'e2e-mutable-car',brandId:'e2e-brand',modelId:'e2e-model-0',variant:'Mutable',year:2026,condition:'NEW',price:1100000,currency:'INR',mileage:0,fuelType:'Electric',transmission:'Automatic',bodyStyle:'SUV',exteriorColor:'White'}});
  expect((await request.put(apiURL+'/vehicles/'+car.id,{headers:h,data:{price:1200000}})).status()).toBe(200);expect((await db.vehicle.findUnique({where:{id:car.id}}))?.price).toBe(1200000);
  expect((await request.delete(apiURL+'/vehicles/'+car.id,{headers:h})).status()).toBe(200);
});

test('page content mutation and read round-trip through actual validation',async({request,db})=>{
  const {token}=await login(request,'CONTENT_EDITOR');const headers={Authorization:`Bearer ${token}`};
  const data={title:'Synthetic page',content:'Synthetic page body',metadata:{fixture:true}};
  const saved=await request.post(apiURL+'/content/pages/e2e-page',{headers,data});expect(saved.status()).toBe(201);
  expect((await (await request.get(apiURL+'/content/pages/e2e-page')).json()).content).toBe(data.content);
  expect((await db.pageContent.findUnique({where:{slug:'e2e-page'}}))?.content).toBe(data.content);
});

test('SEO metadata round-trips without provider access',async({request,db})=>{
  const {token}=await login(request,'CONTENT_EDITOR');const headers={Authorization:`Bearer ${token}`};
  const data={title:'Synthetic SEO',description:'Synthetic description'};
  expect((await request.post(apiURL+'/content/seo/e2e-path',{headers,data})).status()).toBe(201);
  expect(await(await request.get(apiURL+'/content/seo/e2e-path')).json()).toMatchObject(data);
  expect(await db.seoMetadata.findUnique({where:{path:'e2e-path'}})).toMatchObject(data);
});

test('FAQ and testimonial CRUD persist via content permissions',async({request,db})=>{
  const {token}=await login(request,'CONTENT_EDITOR');const h=headers(token);
  for(const [endpoint,data,change]of [
    ['faqs',{question:'API CRUD question',answer:'Original answer',category:'E2E'},{answer:'Updated answer'}],
    ['testimonials',{name:'API CRUD reviewer',quote:'Original quote',rating:5},{quote:'Updated quote'}],
  ]as const){const created=await request.post(apiURL+'/content/'+endpoint,{headers:h,data});expect(created.status()).toBe(201);const row=await created.json();
    expect((await request.put(apiURL+`/content/${endpoint}/${row.id}`,{headers:h,data:change})).status()).toBe(200);
    const record=endpoint==='faqs'?await db.fAQ.findUnique({where:{id:row.id}}):await db.testimonial.findUnique({where:{id:row.id}});expect(record).toMatchObject(change);
    expect((await request.delete(apiURL+`/content/${endpoint}/${row.id}`,{headers:h})).status()).toBe(200);
  }
});

test('profile and staff role/status changes honor current persisted identity',async({request,db})=>{
  const registered=await request.post(apiURL+'/auth/register',{data:{name:'Mutable fixture',email:'mutable@e2e.invalid',password}});const target=await registered.json();
  const profile=await request.put(apiURL+'/auth/profile',{headers:headers(target.token),data:{name:'Updated fixture',phone:'9000000000'}});expect(profile.status()).toBe(200);
  const {token}=await login(request);const h=headers(token);
  expect((await request.post(apiURL+`/users/${target.user.id}/role`,{headers:h,data:{role:'ADMIN'}})).status()).toBe(201);
  const current=await request.post(apiURL+'/auth/login',{data:{email:'mutable@e2e.invalid',password}});const elevated=await current.json();expect((await request.get(apiURL+'/users',{headers:headers(elevated.token)})).status()).toBe(200);
  expect((await request.post(apiURL+`/users/${target.user.id}/role`,{headers:h,data:{role:'CUSTOMER'}})).status()).toBe(201);
  expect((await request.get(apiURL+'/users',{headers:headers(elevated.token)})).status()).toBe(403);
  expect((await request.post(apiURL+`/users/${target.user.id}/toggle-status`,{headers:h})).status()).toBe(201);
  expect((await request.get(apiURL+'/auth/me',{headers:headers(elevated.token)})).status()).toBe(401);
  expect((await request.post(apiURL+'/users/e2e-super_admin/toggle-status',{headers:h})).status()).toBe(409);
  expect(await db.auditLog.count({where:{entityId:target.user.id}})).toBe(3);
});
