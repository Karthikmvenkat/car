import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { USER_READ_ROLES } from '../../common/auth-roles';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...USER_READ_ROLES)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (admin)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post(':id/role')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update user role (admin)' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @GetUser('sub') actorId: string,
  ) {
    return this.usersService.updateRole(id, dto.role, actorId);
  }

  @Post(':id/toggle-status')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Toggle user active/inactive status (admin)' })
  toggleStatus(@Param('id') id: string, @GetUser('sub') actorId: string) {
    return this.usersService.toggleStatus(id, actorId);
  }
}
