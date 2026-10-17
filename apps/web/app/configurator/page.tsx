import { Suspense } from 'react';
import PublicConfigurator from '@/components/vehicles/PublicConfigurator';
export default function Page(){return <Suspense fallback={<div className="page-shell container-main">Loading vehicle…</div>}><PublicConfigurator/></Suspense>;}
