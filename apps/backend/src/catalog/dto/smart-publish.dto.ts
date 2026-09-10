import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SmartPublishDto {
  @ApiProperty({
    description: 'Product Title',
    example: 'Handcrafted Terracotta Diya with Madhubani Motifs',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Product Category',
    example: 'Pottery & Ceramics',
  })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiPropertyOptional({
    description: 'Specific Traditional Craft Style',
    example: 'Madhubani Terracotta',
  })
  @IsString()
  @IsOptional()
  craftType?: string;

  @ApiProperty({
    description: 'Short Cultural Description & Story',
    example: 'Handcrafted alluvial clay diya painted using traditional Kachni line techniques.',
  })
  @IsString()
  @IsNotEmpty()
  shortDescription!: string;

  @ApiPropertyOptional({
    description: 'Raw Materials Used (comma separated or string array in JSON)',
    example: 'Clay, Natural Pigments, Cotton Wick',
  })
  @IsOptional()
  materials?: string | string[];

  @ApiPropertyOptional({
    description: 'AI Suggested Fair Market Price Range',
    example: '₹450 - ₹650',
  })
  @IsString()
  @IsOptional()
  suggestedPriceRange?: string;

  @ApiPropertyOptional({
    description: 'Maximum order limit set by artisan for this craft',
    example: 10,
  })
  @IsOptional()
  maxOrderLimit?: number | string;
}

