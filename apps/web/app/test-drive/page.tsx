import { Suspense } from 'react';
import { VehicleLeadForm } from '@/components/VehicleLeadForm';
export default function TestDrivePage(){return <Suspense fallback={<div className="page-shell container-main">Loading booking form…</div>}><VehicleLeadForm booking/></Suspense>;}
