import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { CommunityService, CreateReviewDto, ReplyToReviewDto, ModerateReviewDto, RequestUploadUrlDto } from './community.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  /**
   * POST /v1/reviews
   * PREMIUM+ required.
   */
  @Post('reviews')
  @UseGuards(ClerkAuthGuard)
  createReview(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReviewDto) {
    return this.communityService.createReview(user.id, dto);
  }

  /**
   * GET /v1/destinations/:countryCode/reviews?page=1&limit=20
   * Public — only PUBLISHED reviews returned.
   */
  @Get('destinations/:countryCode/reviews')
  getReviews(
    @Param('countryCode') countryCode: string,
    @Query('page')  page:  string,
    @Query('limit') limit: string,
  ) {
    return this.communityService.getReviews(
      countryCode,
      page  ? parseInt(page,  10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * POST /v1/reviews/:id/reply
   * Partner right-to-reply. Must include partnerId in body.
   * Auth model: API key in Phase 5; partnerId trust-based in Phase 4.
   */
  @Post('reviews/:id/reply')
  @HttpCode(200)
  replyToReview(@Param('id') id: string, @Body() dto: ReplyToReviewDto) {
    return this.communityService.replyToReview(id, dto);
  }

  /**
   * PATCH /v1/admin/reviews/:id/moderate
   * Internal moderation endpoint. Guard: ClerkAuthGuard (admin role check deferred to Phase 5).
   */
  @Patch('admin/reviews/:id/moderate')
  @UseGuards(ClerkAuthGuard)
  moderateReview(
    @Param('id')    id:  string,
    @CurrentUser()  user: AuthenticatedUser,
    @Body()         dto:  Omit<ModerateReviewDto, 'moderatorId'>,
  ) {
    return this.communityService.moderateReview(id, { ...dto, moderatorId: user.id });
  }

  /**
   * POST /v1/reviews/upload-url
   * Returns presigned upload URL for review media.
   */
  @Post('reviews/upload-url')
  @UseGuards(ClerkAuthGuard)
  requestUploadUrl(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestUploadUrlDto) {
    return this.communityService.requestUploadUrl(user.id, dto);
  }
}
