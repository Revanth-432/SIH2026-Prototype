import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new purchase order',
    description: 'Buyer creates an order for handcrafted items directly from an artisan.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order placed successfully.',
  })
  async createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Get('artisan')
  @ApiOperation({
    summary: 'Retrieve incoming customer orders for the logged-in artisan',
    description: 'Returns orders that contain products created by this artisan, including customer delivery details.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Incoming orders retrieved successfully.',
  })
  async getArtisanOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.getArtisanOrders(user.id);
  }

  @Get('buyer')
  @ApiOperation({
    summary: 'Retrieve order history for the logged-in buyer',
    description: 'Returns all orders placed by the current buyer account.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order history retrieved successfully.',
  })
  async getBuyerOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.getBuyerOrders(user.id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update order status',
    description: 'Allows an artisan or admin to update lifecycle status (e.g. PENDING -> CONFIRMED -> SHIPPED -> DELIVERED).',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the order',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order status updated successfully.',
  })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      user.id,
      dto.status,
      user.roles || [],
    );
  }
}
