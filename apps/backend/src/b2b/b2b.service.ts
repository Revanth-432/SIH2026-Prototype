import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateB2BInquiryDto } from './dto/create-inquiry.dto';
import { InquiryStatus, MediaType } from '@artisan/database';

@Injectable()
export class B2BService {
  private readonly logger = new Logger(B2BService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submits a B2B bulk inquiry / RFQ for an artisan craft.
   */
  async createInquiry(buyerId: string, dto: CreateB2BInquiryDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: {
        translations: true,
        pricing: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Craft product with ID ${dto.productId} not found`);
    }

    const inquiry = await this.prisma.b2BInquiry.create({
      data: {
        b2bBuyerId: buyerId,
        artisanId: product.artisanId,
        productId: dto.productId,
        requestedQuantity: dto.requestedQuantity,
        targetPrice: dto.targetPrice ?? null,
        deliveryTimeline: dto.deliveryTimeline ?? null,
        message: dto.message ?? null,
        status: InquiryStatus.OPEN,
      },
      include: {
        product: {
          include: {
            translations: true,
            media: true,
          },
        },
        b2bBuyer: {
          include: {
            profile: true,
          },
        },
      },
    });

    this.logger.log(`B2B Inquiry created: ${inquiry.id} for artisan ${product.artisanId}, qty: ${dto.requestedQuantity}`);
    return this.formatInquiryResponse(inquiry);
  }

  /**
   * Retrieves all wholesale bulk quote requests received by an artisan.
   */
  async getArtisanInquiries(artisanId: string) {
    const inquiries = await this.prisma.b2BInquiry.findMany({
      where: { artisanId },
      include: {
        product: {
          include: {
            translations: true,
            media: true,
          },
        },
        b2bBuyer: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return inquiries.map((inq) => this.formatInquiryResponse(inq));
  }

  /**
   * Updates status of a bulk inquiry (e.g. OPEN -> RESPONDED -> CLOSED).
   */
  async updateInquiryStatus(
    inquiryId: string,
    userId: string,
    newStatus: InquiryStatus,
    userRoles: string[],
  ) {
    const inquiry = await this.prisma.b2BInquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID ${inquiryId} not found`);
    }

    const isAdmin = userRoles.includes('ADMIN');
    const isArtisan = inquiry.artisanId === userId;

    if (!isArtisan && !isAdmin) {
      throw new ForbiddenException('Only the designated artisan or an admin can update this inquiry');
    }

    const updated = await this.prisma.b2BInquiry.update({
      where: { id: inquiryId },
      data: { status: newStatus },
      include: {
        product: {
          include: {
            translations: true,
            media: true,
          },
        },
        b2bBuyer: {
          include: {
            profile: true,
          },
        },
      },
    });

    this.logger.log(`B2B Inquiry ${inquiryId} status updated to ${newStatus}`);
    return this.formatInquiryResponse(updated);
  }

  private formatInquiryResponse(inquiry: any) {
    const p = inquiry.product;
    const translation = p?.translations?.[0];
    const thumbnail =
      p?.media?.find((m: any) => m.mediaType === MediaType.PROCESSED_PHOTO)?.url ||
      p?.media?.find((m: any) => m.mediaType === MediaType.ORIGINAL_PHOTO)?.url ||
      p?.media?.[0]?.url ||
      null;

    return {
      id: inquiry.id,
      b2bBuyerId: inquiry.b2bBuyerId,
      artisanId: inquiry.artisanId,
      productId: inquiry.productId,
      productTitle: translation?.title || 'Handcrafted Craft Item',
      thumbnailUrl: thumbnail,
      requestedQuantity: inquiry.requestedQuantity,
      targetPrice: inquiry.targetPrice ? Number(inquiry.targetPrice) : null,
      deliveryTimeline: inquiry.deliveryTimeline,
      message: inquiry.message,
      status: inquiry.status,
      createdAt: inquiry.createdAt,
      updatedAt: inquiry.updatedAt,
      buyerName: inquiry.b2bBuyer?.profile?.fullName || 'Wholesale Buyer',
      buyerBusiness: inquiry.b2bBuyer?.profile?.businessName || null,
      buyerPhone: inquiry.b2bBuyer?.phone || null,
      buyerEmail: inquiry.b2bBuyer?.email || null,
    };
  }
}
