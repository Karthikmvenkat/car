import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { EnquiriesModule } from './modules/enquiries/enquiries.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { UsersModule } from './modules/users/users.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ContentModule } from './modules/content/content.module';
import { ConfiguratorModule } from './modules/configurator/configurator.module';
import { HealthController } from './health.controller';
import { CatalogIntakeModule } from './modules/catalog-intake/catalog-intake.module';
import { CatalogMediaModule } from './modules/catalog-media/catalog-media.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    VehiclesModule,
    EnquiriesModule,
    BookingsModule,
    UsersModule,
    BrandsModule,
    ContentModule,
    ConfiguratorModule,
    CatalogIntakeModule,
    CatalogMediaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
