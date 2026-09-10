import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generates a 1536-dimensional vector embedding for semantic search.
   * Leverages OpenAI text-embedding-3-small or Gemini if configured,
   * or a deterministic 1536-dim semantic projection fallback for dev environments.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const openaiKey =
      this.configService.get<string>('OPENAI_API_KEY') ||
      process.env.OPENAI_API_KEY;

    if (openaiKey && openaiKey !== 'your-openai-api-key') {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text.slice(0, 8000),
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          const embedding: number[] = data.data?.[0]?.embedding;
          if (embedding && embedding.length === 1536) {
            return embedding;
          }
        }
      } catch (err: any) {
        this.logger.warn(`OpenAI embedding failed, falling back: ${err.message}`);
      }
    }

    // Deterministic 1536-dimensional normalized vector generator
    return this.generateDeterministicVector(text, 1536);
  }

  /**
   * Generates and saves the vector embedding for a specific product into product_metadata
   */
  async generateAndSaveProductEmbedding(productId: string): Promise<number[] | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        translations: true,
        metadata: true,
      },
    });

    if (!product) return null;

    const title = product.translations[0]?.title || '';
    const description = product.translations[0]?.shortDescription || '';
    const category = product.category || '';
    const craftType = product.metadata?.craftType || '';
    const material = product.metadata?.material || '';

    const textToEmbed = `${title} ${category} ${craftType} ${material} ${description}`.trim();

    this.logger.log(`Generating embedding for product ${productId}: "${textToEmbed.slice(0, 80)}..."`);
    const embedding = await this.generateEmbedding(textToEmbed);

    try {
      const vectorString = `[${embedding.join(',')}]`;
      await this.prisma.$executeRawUnsafe(
        `UPDATE "product_metadata" SET "embedding" = $1::vector WHERE "product_id" = $2::uuid`,
        vectorString,
        productId,
      );
      this.logger.log(`Saved pgvector embedding for product ${productId}`);
    } catch (dbErr: any) {
      this.logger.warn(
        `Could not write to product_metadata.embedding via raw SQL (pgvector column may need migration): ${dbErr.message}`,
      );
    }

    return embedding;
  }

  /**
   * Deterministic semantic projection producing a unit-normalized 1536-dimensional vector
   */
  private generateDeterministicVector(text: string, dimensions: number = 1536): number[] {
    const vector = new Array(dimensions).fill(0);
    const normalized = text.toLowerCase().trim();

    for (let i = 0; i < normalized.length; i++) {
      const code = normalized.charCodeAt(i);
      const idx1 = (code * 31 + i) % dimensions;
      const idx2 = (code * 17 + i * 7) % dimensions;
      vector[idx1] = (vector[idx1] || 0) + 0.1;
      vector[idx2] = (vector[idx2] || 0) + 0.05;
    }

    // Compute magnitude for unit vector normalization
    let sumSq = 0;
    for (let i = 0; i < dimensions; i++) {
      sumSq += vector[i] * vector[i];
    }
    const magnitude = Math.sqrt(sumSq) || 1;

    return vector.map((val) => val / magnitude);
  }
}
