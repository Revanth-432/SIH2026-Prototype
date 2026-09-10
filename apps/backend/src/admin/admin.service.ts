import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmbeddingService } from '../search/embedding.service';
import { ProductStatus, MediaType } from '@artisan/database';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Fetches all products currently in moderation review.
   */
  async getPendingProducts() {
    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.IN_REVIEW,
      },
      include: {
        translations: true,
        metadata: true,
        pricing: true,
        media: {
          orderBy: { displayOrder: 'asc' },
        },
        artisan: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => {
      const translation = p.translations[0];
      const processedPhoto = p.media.find(
        (m) => m.mediaType === MediaType.PROCESSED_PHOTO,
      );
      const originalPhoto = p.media.find(
        (m) => m.mediaType === MediaType.ORIGINAL_PHOTO,
      );
      const marketingAsset = p.media.find(
        (m) => m.mediaType === MediaType.MARKETING_ASSET,
      );

      return {
        id: p.id,
        title: translation?.title || 'Untitled Artisan Craft',
        category: p.category,
        craftType: p.metadata?.craftType,
        material: p.metadata?.material,
        shortDescription: translation?.shortDescription,
        status: p.status,
        createdAt: p.createdAt,
        price: p.pricing?.aiRecommendedPrice
          ? Number(p.pricing.aiRecommendedPrice)
          : null,
        artisanName: p.artisan.profile?.fullName || 'Artisan',
        artisanRegion: p.artisan.profile?.region,
        thumbnailUrl:
          processedPhoto?.url || originalPhoto?.url || p.media[0]?.url || null,
        marketingUrl: marketingAsset?.url || null,
      };
    });
  }

  /**
   * Approves a craft submission, sets status to PUBLISHED,
   * and indexes vector embeddings in pgvector for semantic search.
   */
  async approveProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: ProductStatus.PUBLISHED },
    });

    this.logger.log(`Product ${productId} approved and set to PUBLISHED`);

    // Trigger Phase 7 pgvector embedding generation asynchronously
    this.embeddingService
      .generateAndSaveProductEmbedding(productId)
      .catch((err) => {
        this.logger.error(
          `Failed to index embedding for approved product ${productId}: ${err.message}`,
        );
      });

    return {
      id: updated.id,
      status: updated.status,
      message: 'Product approved and indexed for marketplace search.',
    };
  }

  /**
   * Aggregates platform statistics for the moderation dashboard.
   */
  async getPlatformStats() {
    const [totalUsers, totalOrders, totalCrafts, pendingCount, orders] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.order.count(),
        this.prisma.product.count(),
        this.prisma.product.count({
          where: { status: ProductStatus.IN_REVIEW },
        }),
        this.prisma.order.findMany({
          select: { totalAmount: true },
        }),
      ]);

    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.totalAmount || 0),
      0,
    );

    return {
      totalUsers,
      totalOrders,
      totalCrafts,
      pendingReviewCount: pendingCount,
      totalRevenueINR: Math.round(totalRevenue),
    };
  }
}
