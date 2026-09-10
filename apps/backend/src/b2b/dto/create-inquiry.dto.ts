import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateB2BInquiryDto {
  @ApiProperty({
    description: 'UUID of the craft product for wholesale inquiry',
    example: 'd3b07384-d113-46fb-9c8e-a619001e9d1a',
  })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({
    description: 'Bulk quantity requested (e.g. 50, 100, 500)',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  requestedQuantity!: number;

  @ApiPropertyOptional({
    description: 'Target price per unit in INR',
    example: 350,
  })
  @IsOptional()
  @IsNumber()
  targetPrice?: number;

  @ApiPropertyOptional({
    description: 'Required delivery timeframe',
    example: 'Within 45 days for Diwali gifting',
  })
  @IsOptional()
  @IsString()
  deliveryTimeline?: string;

  @ApiPropertyOptional({
    description: 'Specific custom branding, packaging, or dimension requirements',
    example: 'Custom packaging with corporate logo stamp on terracotta base.',
  })
  @IsOptional()
  @IsString()
  message?: string;
}
