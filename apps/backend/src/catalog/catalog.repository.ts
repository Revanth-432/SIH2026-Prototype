import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  Product,
  ProductStatus,
  MediaType,
  ProcessingStatus,
} from '@artisan/database';
import { SmartPublishDto } from './dto/smart-publish.dto';
import { UploadResult } from '../storage/supabase-storage.service';
import { CalculatedPricing } from '../pricing/pricing.service';

export interface CreateProductTransactionParams {
  artisanId: string;
  dto: SmartPublishDto;
  imageUpload: UploadResult;
  audioUpload?: UploadResult | null;
  pricing: CalculatedPricing;
}

@Injectable()
export class CatalogRepository {
  private readonly logger = new Logger(CatalogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute atomic database transaction creating Product, Translation,
   * Metadata, Media links, and Pricing records.
   */
  async createPublishedProduct(params: CreateProductTransactionParams): Promise<Product> {
    const { artisanId, dto, imageUpload, audioUpload, pricing } = params;

    const materialsArray = Array.isArray(dto.materials)
      ? dto.materials
      : typeof dto.materials === 'string'
        ? dto.materials.split(',').map((m) => m.trim()).filter(Boolean)
        : [];

    return this.prisma.$transaction(async (tx) => {
      const parsedStock = dto.maxOrderLimit
        ? Math.max(1, parseInt(String(dto.maxOrderLimit), 10) || 10)
        : 10;

      // 1. Create Core Product
      const product = await tx.product.create({
        data: {
          artisanId,
          category: dto.category,
          status: ProductStatus.PUBLISHED,
          baseStock: parsedStock,
        },
      });

      this.logger.log(`Created Product ${product.id} for artisan ${artisanId}`);

      // 2. Create Base Translation (English / Primary)
      await tx.productTranslation.create({
        data: {
          productId: product.id,
          languageCode: 'en',
          title: dto.title,
          shortDescription: dto.shortDescription,
          features: materialsArray,
        },
      });

      // 3. Create Product Metadata
      await tx.productMetadata.create({
        data: {
          productId: product.id,
          craftType: dto.craftType || 'Handmade Craft',
          material: materialsArray.join(', '),
          colorPalette: [],
          rawAiTags: {
            suggestedPriceRange: dto.suggestedPriceRange,
            originalCategory: dto.category,
          },
        },
      });

      // 4. Create Media record for product image
      await tx.media.create({
        data: {
          productId: product.id,
          storageBucket: imageUpload.bucket,
          storagePath: imageUpload.path,
          url: imageUpload.publicUrl,
          mediaType: MediaType.ORIGINAL_PHOTO,
          processingStatus: ProcessingStatus.COMPLETED,
          displayOrder: 0,
        },
      });

      // 5. Create Media record for voice note if available
      if (audioUpload) {
        await tx.media.create({
          data: {
            productId: product.id,
            storageBucket: audioUpload.bucket,
            storagePath: audioUpload.path,
            url: audioUpload.publicUrl,
            mediaType: MediaType.VOICE_NOTE,
            processingStatus: ProcessingStatus.COMPLETED,
            displayOrder: 1,
          },
        });
      }

      // 6. Create Pricing record
      await tx.pricing.create({
        data: {
          productId: product.id,
          aiMinPrice: pricing.aiMinPrice,
          aiRecommendedPrice: pricing.aiRecommendedPrice,
          aiPremiumPrice: pricing.aiPremiumPrice,
          pricingExplanation: pricing.pricingExplanation,
          currency: pricing.currency,
        },
      });

      return product;
    });
  }

  /**
   * Fetch complete product with relations for verification / response
   */
  async findProductWithDetails(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        translations: true,
        metadata: true,
        media: true,
        pricing: true,
      },
    });
  }

  /**
   * Retrieve all products belonging to a specific artisan
   */
  async findByArtisanId(artisanId: string) {
    return this.prisma.product.findMany({
      where: { artisanId },
      include: {
        translations: true,
        metadata: true,
        pricing: true,
        media: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update product status (e.g. ARCHIVED or PUBLISHED) ensuring artisan owns it
   */
  async updateProductStatus(productId: string, artisanId: string, status: ProductStatus) {
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, artisanId },
    });
    if (!existing) {
      throw new Error('Product not found or not owned by artisan');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { status },
      include: {
        translations: true,
        metadata: true,
        pricing: true,
        media: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Delete product ensuring artisan owns it
   */
  async deleteProduct(productId: string, artisanId: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, artisanId },
    });
    if (!existing) {
      throw new Error('Product not found or not owned by artisan');
    }

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }
}

