import { test,expect,apiURL,login } from './support/fixtures';
const sharp: typeof import('sharp')['default']=require('sharp');
const h=(token:string)=>({Authorization:`Bearer ${token}`});
test('real source/candidate/media preparation, review, privacy, withdrawal and revocation',async({request,db})=>{
  const admin=await login(request);const inventory=await login(request,'INVENTORY_MANAGER');
  const sourceData={name:'E2E synthetic source',sourceUrl:'https://fixture.example.invalid/catalog',license:'CC0',evidenceRef:'private/e2e-permission',attribution:'Synthetic creator / CC0',commercialUse:true,storageAllowed:true,displayAllowed:true,modificationAllowed:true,validUntil:new Date(Date.now()+86400000).toISOString()};
  expect((await request.post(apiURL+'/catalog-intake/sources',{headers:h(inventory.token),data:sourceData})).status()).toBe(403);
  const approved=await request.post(apiURL+'/catalog-intake/sources',{headers:h(admin.token),data:sourceData});expect(approved.status()).toBe(201);const source=await approved.json();
  const observed=new Date().toISOString();
  const input={sourceId:source.id,importKey:'e2e_catalog_01',identity:{market:'IN',condition:'NEW',make:'Synthetic',model:'Aster',generation:'G1',modelYear:2026,variant:'Base',fuel:'ELECTRIC',transmission:'SINGLE_SPEED'},saleEvidenceUrl:'https://fixture.example.invalid/sale',saleObservedAt:observed,facts:[{field:'lengthMm',value:4.2,unit:'m',rawText:'4.2 m',evidenceUrl:'https://fixture.example.invalid/spec',observedAt:observed}]};
  const prepared=await request.post(apiURL+'/catalog-intake/candidates',{headers:h(inventory.token),data:input});expect(prepared.status()).toBe(201);const candidate=await prepared.json();expect(candidate.facts[0].normalizedValue).toBe(4200);
  const repeated=await request.post(apiURL+'/catalog-intake/candidates',{headers:h(inventory.token),data:input});expect((await repeated.json()).id).toBe(candidate.id);
  expect((await request.post(apiURL+'/catalog-intake/candidates',{headers:h(inventory.token),data:{...input,identity:{...input.identity,variant:'Changed'}}})).status()).toBe(409);
  expect((await request.post(apiURL+`/catalog-intake/candidates/${candidate.id}/review`,{headers:h(inventory.token),data:{decision:'ACCEPTED',note:'E2E facts reviewed'}})).status()).toBe(201);
  const bytes=await sharp({create:{width:320,height:180,channels:3,background:'#326699'}}).png().toBuffer();
  const metadata={sourceId:source.id,importKey:'e2e_media_01',evidenceUrl:'https://fixture.example.invalid/photo',evidenceRef:'private/e2e-photo-proof',creator:'E2E Creator',attribution:'E2E Creator / CC0',alt:'Synthetic exact variant',acquiredAt:observed};
  const multipart={...metadata,image:{name:'untrusted-name.png',mimeType:'image/png',buffer:bytes}};
  const uploaded=await request.post(apiURL+`/catalog-media/candidates/${candidate.id}/images`,{headers:h(inventory.token),multipart});expect(uploaded.status()).toBe(201);const media=await uploaded.json();expect(media).not.toHaveProperty('storageKey');expect(media.status).toBe('READY_FOR_REVIEW');
  const retry=await request.post(apiURL+`/catalog-media/candidates/${candidate.id}/images`,{headers:h(inventory.token),multipart});expect((await retry.json()).id).toBe(media.id);
  const previewPath=apiURL+`/catalog-media/images/${media.id}/derivatives/preview`;
  expect((await request.get(previewPath)).status()).toBe(401);
  const preview=await request.get(previewPath,{headers:h(inventory.token)});expect(preview.status()).toBe(200);expect(preview.headers()['cache-control']).toBe('private, no-store');expect((await sharp(await preview.body()).metadata()).format).toBe('webp');
  expect((await request.get(apiURL+`/catalog-media/images/${media.id}/original`,{headers:h(inventory.token)})).status()).toBe(404);
  const review=await request.post(apiURL+`/catalog-media/images/${media.id}/review`,{headers:h(inventory.token),data:{decision:'ACCEPTED',note:'Exact variant checked',identityConfirmed:true}});expect(review.status()).toBe(201);expect((await review.json()).eligibleForPublication).toBe(true);
  expect((await request.post(apiURL+`/catalog-media/images/${media.id}/review`,{headers:h(inventory.token),data:{decision:'REJECTED',note:'Conflicting review',identityConfirmed:false}})).status()).toBe(409);
  expect((await request.post(apiURL+`/catalog-media/images/${media.id}/withdraw`,{headers:h(inventory.token)})).status()).toBe(201);expect((await request.get(previewPath,{headers:h(inventory.token)})).status()).toBe(409);
  expect((await request.post(apiURL+`/catalog-intake/sources/${source.id}/revoke`,{headers:h(admin.token)})).status()).toBe(201);
  const current=await request.get(apiURL+`/catalog-intake/candidates/${candidate.id}`,{headers:h(inventory.token)});expect((await current.json()).eligibleForPublication).toBe(false);
  expect(await db.catalogMedia.count({where:{candidateId:candidate.id}})).toBe(1);expect(await db.auditLog.count({where:{entityId:media.id}})).toBe(3);
  expect(await db.vehicle.count()).toBe(5);
});

test('new intake rejects invalid rights, nested fields and invalid images',async({request})=>{
  const {token}=await login(request);const headers=h(token);
  expect((await request.post(apiURL+'/catalog-intake/sources',{headers,data:{name:'Invalid',license:'CC_BY_NC'}})).status()).toBe(400);
  expect((await request.post(apiURL+'/catalog-intake/candidates',{headers,data:{sourceId:'x',importKey:'too_short',identity:{market:'US'}}})).status()).toBe(400);
  expect((await request.post(apiURL+'/catalog-media/images/unknown/review',{headers,data:{decision:'ACCEPTED',note:'Test',identityConfirmed:'false'}})).status()).toBe(400);
});
