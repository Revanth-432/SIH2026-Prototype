import {
  Controller,
  Post,
  Get,
  Param,
  Body,
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
  ApiBody,
} from '@nestjs/swagger';
import { PollinationsApiService } from './pollinations-api.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

import { IsString, IsOptional } from 'class-validator';

class GenerateMarketingDto {
  @IsString()
  @IsOptional()
  scenePrompt?: string;
}

@ApiTags('Marketing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly pollinationsService: PollinationsApiService,
  ) {}

  @Post(':productId/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate stunning lifestyle marketing poster using Pollinations AI',
    description:
      'Synthesizes an authentic Indian handicraft lifestyle scene prompt from product title and materials, fetches 4K image from Pollinations AI, and stores it in Supabase as MARKETING_ASSET.',
  })
  @ApiParam({
    name: 'productId',
    description: 'UUID of the craft product',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        scenePrompt: {
          type: 'string',
          description: 'Optional custom scene prompt override',
          example: 'On a traditional silk fabric with Diya lighting',
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Marketing poster generated and saved to Supabase storage.',
  })
  async generateAsset(
    @Param('productId') productId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body?: GenerateMarketingDto,
  ) {
    return this.pollinationsService.generateMarketingAsset(
      productId,
      user.id,
      body?.scenePrompt,
    );
  }

  @Get(':productId')
  @ApiOperation({
    summary: 'Retrieve all marketing assets and media variants for a craft',
    description:
      'Returns product overview along with original photo, background-cleaned photo, and all generated marketing posters.',
  })
  @ApiParam({
    name: 'productId',
    description: 'UUID of the craft product',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product marketing assets returned successfully.',
  })
  async getMarketingDetails(
    @Param('productId') productId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pollinationsService.getProductMarketingDetails(
      productId,
      user.id,
    );
  }
}
