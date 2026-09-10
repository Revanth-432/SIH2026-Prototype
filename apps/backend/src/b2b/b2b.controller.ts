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
import { B2BService } from './b2b.service';
import { CreateB2BInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('B2B Wholesale')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('b2b')
export class B2BController {
  constructor(private readonly b2bService: B2BService) {}

  @Post('inquiry')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a bulk wholesale inquiry / RFQ',
    description: 'Enables retail chains, boutiques, and export houses to negotiate bulk orders directly with traditional artisans.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'B2B bulk inquiry created successfully.',
  })
  async createInquiry(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateB2BInquiryDto,
  ) {
    return this.b2bService.createInquiry(user.id, dto);
  }

  @Get('inquiries/artisan')
  @ApiOperation({
    summary: 'Retrieve bulk wholesale inquiries for the logged-in artisan',
    description: 'Returns all open wholesale requests received from verified B2B buyers.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wholesale inquiries retrieved successfully.',
  })
  async getArtisanInquiries(@CurrentUser() user: AuthenticatedUser) {
    return this.b2bService.getArtisanInquiries(user.id);
  }

  @Patch('inquiries/:id/status')
  @ApiOperation({
    summary: 'Update bulk inquiry status',
    description: 'Artisan can mark inquiry as OPEN, RESPONDED, or CLOSED.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the bulk inquiry',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inquiry status updated successfully.',
  })
  async updateInquiryStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateInquiryStatusDto,
  ) {
    return this.b2bService.updateInquiryStatus(
      id,
      user.id,
      dto.status,
      user.roles || [],
    );
  }
}
