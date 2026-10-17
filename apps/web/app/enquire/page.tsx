import { Suspense } from 'react';
import { VehicleLeadForm } from '@/components/VehicleLeadForm';
export default function EnquirePage(){return <Suspense fallback={<div className="page-shell container-main">Loading enquiry form…</div>}><VehicleLeadForm/></Suspense>;}
