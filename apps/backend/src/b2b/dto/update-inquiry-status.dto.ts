import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InquiryStatus } from '@artisan/database';

export class UpdateInquiryStatusDto {
  @ApiProperty({
    description: 'Updated status of the bulk inquiry',
    enum: InquiryStatus,
    example: InquiryStatus.RESPONDED,
  })
  @IsEnum(InquiryStatus)
  @IsNotEmpty()
  status!: InquiryStatus;
}
