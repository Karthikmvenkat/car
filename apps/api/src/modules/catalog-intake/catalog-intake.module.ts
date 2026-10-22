import { Module } from '@nestjs/common';
import { CatalogIntakeController } from './catalog-intake.controller';
import { CatalogIntakeService } from './catalog-intake.service';

@Module({ controllers: [CatalogIntakeController], providers: [CatalogIntakeService] })
export class CatalogIntakeModule {}
