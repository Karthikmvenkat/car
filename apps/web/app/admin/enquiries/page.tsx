import { AdminRecords } from '@/components/configurator/AdminRecords';
export default function Page(){return <AdminRecords title="Enquiries" endpoint="/enquiries" statuses={['NEW','CONTACTED','QUALIFIED','TEST_DRIVE_SCHEDULED','COMPLETED','WON','LOST']} />;}
