import { Suspense } from 'react';
import { demoVehicles } from '@/lib/demo-data';
import PublicConfigurator from '@/components/vehicles/PublicConfigurator';
export const metadata = { title: 'Vehicle details' };
export function generateStaticParams(){return demoVehicles.map(v=>({slug:v.slug}));}
export const dynamicParams=false;
export default function VehiclePage({params}:{params:{slug:string}}){return <Suspense fallback={<div className="page-shell container-main">Loading vehicle…</div>}><PublicConfigurator slugOverride={params.slug}/></Suspense>;}
