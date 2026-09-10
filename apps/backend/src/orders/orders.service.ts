import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, MediaType } from '@artisan/database';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new purchase order for a buyer.
   */
  async createOrder(buyerId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        pricing: true,
        translations: true,
        media: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products in the order could not be found');
    }

    const firstProduct = products[0];
    if (!firstProduct) {
      throw new NotFoundException('No valid products found for order');
    }
    const primaryArtisanId = firstProduct.artisanId;

    // Calculate line items and total amount
    let totalAmount = 0;
    const orderItemsData = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const unitPrice = product.pricing?.aiRecommendedPrice
        ? Number(product.pricing.aiRecommendedPrice)
        : 499;

      const lineTotal = unitPrice * item.quantity;
      totalAmount += lineTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: unitPrice,
      };
    });

    const order = await this.prisma.order.create({
      data: {
        buyerId,
        artisanId: primaryArtisanId,
        totalAmount,
        currency: firstProduct.pricing?.currency || 'INR',
        status: OrderStatus.PENDING,
        shippingAddress: dto.shippingAddress,
        buyerPhone: dto.buyerPhone,
        buyerNotes: dto.buyerNotes,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
                media: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Order created: ${order.id} for artisan ${primaryArtisanId}, total ₹${totalAmount}`);
    return this.formatOrderResponse(order);
  }

  /**
   * Retrieves incoming customer orders for an artisan.
   */
  async getArtisanOrders(artisanId: string) {
    const orders = await this.prisma.order.findMany({
      where: { artisanId },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
                media: true,
              },
            },
          },
        },
        buyer: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => this.formatOrderResponse(order));
  }

  /**
   * Retrieves purchase history for a buyer.
   */
  async getBuyerOrders(buyerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { buyerId },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
                media: true,
              },
            },
          },
        },
        artisan: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => this.formatOrderResponse(order));
  }

  /**
   * Updates order lifecycle status (e.g. PENDING -> CONFIRMED -> SHIPPED -> DELIVERED).
   */
  async updateOrderStatus(
    orderId: string,
    userId: string,
    newStatus: OrderStatus,
    userRoles: string[],
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const isAdmin = userRoles.includes('ADMIN');
    const isOrderArtisan = order.artisanId === userId;

    if (!isOrderArtisan && !isAdmin) {
      throw new ForbiddenException('Only the designated artisan or an admin can update this order');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: {
        items: {
          include: {
            product: {
              include: {
                translations: true,
                media: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Order ${orderId} status updated to ${newStatus} by user ${userId}`);
    return this.formatOrderResponse(updated);
  }

  private formatOrderResponse(order: any) {
    return {
      id: order.id,
      buyerId: order.buyerId,
      artisanId: order.artisanId,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      status: order.status,
      shippingAddress: order.shippingAddress,
      buyerPhone: order.buyerPhone,
      buyerNotes: order.buyerNotes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      buyerName: order.buyer?.profile?.fullName || order.buyer?.email || 'Customer',
      artisanName: order.artisan?.profile?.fullName || 'Artisan Partner',
      items: order.items?.map((item: any) => {
        const p = item.product;
        const translation = p?.translations?.[0];
        const thumbnail =
          p?.media?.find((m: any) => m.mediaType === MediaType.PROCESSED_PHOTO)?.url ||
          p?.media?.find((m: any) => m.mediaType === MediaType.ORIGINAL_PHOTO)?.url ||
          p?.media?.[0]?.url ||
          null;

        return {
          id: item.id,
          productId: item.productId,
          title: translation?.title || 'Handmade Craft Item',
          quantity: item.quantity,
          priceAtPurchase: Number(item.priceAtPurchase),
          thumbnailUrl: thumbnail,
        };
      }) || [],
    };
  }
}
