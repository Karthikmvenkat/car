# CarPal redesign

The public website uses navy, blue and white, Manrope headings and Inter body text. The vehicle detail page follows the supplied Exter reference with a large gallery, compact colour cards, price and enquiry panel, specification strip, working information tabs and a navy navigation bar. Mobile stacks the gallery and configuration panel.

## Connected behaviour

Published inventory feeds the home, browse, favourites and comparison pages. Vehicle colours use saved model-specific photo URLs; selection updates the image and saving calls the configuration API. Test drive and enquiry forms use the existing API. Admin dashboard and records use authenticated data. The public API additionally exposes saved gallery images and feature names.

## Main implementation

- apps/web/components/vehicles/PublicConfigurator.tsx: shared live vehicle detail and configurator.
- apps/web/components/layout: navigation and footer.
- apps/web/components/home: home design and live inventory.
- apps/web/app/compare, finance, sell: comparison, EMI and seller contact.
- apps/web/components/VehicleLeadForm.tsx: connected lead forms.
- apps/web/lib/emi.ts: EMI calculations.
- apps/web/app/admin: dashboard and record views.
- apps/api/src/modules/configurator/configurator-public.service.ts: public vehicle data.

## Data and service limitations

Interior photos, extra gallery angles and 360-degree controls require matching saved assets. No extra angles or manufacturer badges are fabricated. Detailed specifications and features display only when entered. Current vehicle records retain their saved fuel and transmission values, even if the variant name suggests different specifications. Colour imagery can depict a different trim.

Seller/contact pages create an email draft. Password reset, admin content publishing and settings have no connected service and say so. Disabled controls do not report success. No deployment or credential changes were made.

## Verification

TypeScript passed after the detail redesign. Browser checks confirmed the Exter colour photo changes from Titan Black Matte to Atlas White, desktop and mobile layouts, gallery expansion, and information tabs. Earlier route checks covered 37 HTTP routes and seven EMI cases. See redesign-route-checks.json. The production build includes lint and type validation; see redesign-build.log for final results. Standalone lint in the restricted environment failed dependency resolution; the production build runs with installed dependencies outside that environment.

Screenshots: carpal-vehicle-desktop.png and carpal-vehicle-mobile.png.

Final production build completed successfully, including lint and type validation. Development server restarted on localhost:3002.
