import { AdminRecords } from '@/components/configurator/AdminRecords';
export default function Page(){return <AdminRecords title="Test drives" endpoint="/bookings" statuses={['PENDING','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW']} />;}
