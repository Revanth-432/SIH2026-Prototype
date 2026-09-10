import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@artisan/database';

@ApiTags('Admin Moderation')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('products/pending')
  @ApiOperation({
    summary: 'Retrieve products waiting in review queue',
    description: 'Returns all artisan crafts submitted with status IN_REVIEW for platform admin quality check.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending craft submissions returned.',
  })
  async getPendingProducts() {
    return this.adminService.getPendingProducts();
  }

  @Patch('products/:id/approve')
  @ApiOperation({
    summary: 'Approve a craft product for marketplace listing',
    description: 'Changes product status to PUBLISHED and triggers asynchronous pgvector semantic embedding indexing.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the craft product',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product approved and queued for vector search indexing.',
  })
  async approveProduct(@Param('id') id: string) {
    return this.adminService.approveProduct(id);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Retrieve global platform metrics and KPIs',
    description: 'Returns aggregate numbers for total registered users, crafts listed, total orders, and gross platform revenue.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Platform metrics returned successfully.',
  })
  async getStats() {
    return this.adminService.getPlatformStats();
  }
}
