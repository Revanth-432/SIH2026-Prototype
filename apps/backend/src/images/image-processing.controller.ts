import {
  Controller,
  Post,
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
import { BackgroundRemovalService } from './background-removal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Media } from '@artisan/database';

@ApiTags('Images')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('images')
export class ImageProcessingController {
  constructor(
    private readonly backgroundRemovalService: BackgroundRemovalService,
  ) {}

  @Post(':productId/process-background')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate multi-angle professional studio assets (Cutout, Side, Top-Down, Close-Up)',
    description:
      'Removes the background from the original craft photo to create a clean studio cutout, then executes an Img2Img Generative AI pipeline to generate 3 professional angles (45° Side Angle, Top-Down Flat Lay, and Macro Close-Up). Saves all 4 assets to Supabase Storage and returns an array of the newly created Media records.',
  })
  @ApiParam({
    name: 'productId',
    description: 'UUID of the craft product',
    example: '8fd4f6e9-9549-49c7-90e3-19caa9816141',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Array of 4 PROCESSED_PHOTO media records (Clean Cutout + 3 Studio Angles) created.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found for the authenticated artisan.',
  })
  async processBackground(
    @Param('productId') productId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Media[]> {
    return this.backgroundRemovalService.processProductBackground(
      productId,
      user.id,
    );
  }
}

