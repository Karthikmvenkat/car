# Contracts
- POST /quotations: {requestKey UUID,vehicleSlug,colourId?,phone,email,consent:true}. Strict whitelist/type/length, publication/colour check, canonical replay or conflict409, persistent quota429; response {reference,message} only.
- GET /quotations?page=1&limit=20&status=: current sales staff only, max50; {items,total,page,limit}. Rows contain snapshot/contact/status/version and revision metadata, never PDF bytes.
- GET /quotations/:id: current sales detail/revisions/snapshots, no binary data.
- POST /quotations/:id/status: {expectedVersion,status:NEW|CONTACTED|CLOSED}; active sales actor/version check plus audit.
- POST /quotations/:id/revisions: {expectedVersion,reviewed:true,customerName,customerLocation,issuerName,issuerAddress,issuerContact,validUntil YYYY-MM-DD,deliveryEstimate?,terms,items:[{label,note?,kind,amountPaise}]}. Server totals/context, PDF generation then atomic immutable revision/audit/version.
- GET /quotations/:id/revisions/:revisionId/pdf: current sales only; verified hash, application/pdf, attachment with server IDs, private/no-store/nosniff. No public artifact route.
- UI: accessible contact dialog with submitting/error/success states; staff table/status/pagination, Prepare -> Review -> Confirm/create PDF -> Download. No account/customer email sending/payment.
