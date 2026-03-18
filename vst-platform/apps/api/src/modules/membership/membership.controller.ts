import { Controller, Get, Post, Body, UseGuards, Redirect } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  // GET /v1/membership/plans  — public
  @Get('plans')
  getPlans() {
    return this.membershipService.getPlans();
  }

  // GET /v1/membership  — auth required
  @Get()
  @UseGuards(ClerkAuthGuard)
  getMembership(@CurrentUser() user: AuthenticatedUser) {
    return this.membershipService.getMembership(user.id);
  }

  // POST /v1/membership/subscribe  — returns Stripe checkout URL
  @Post('subscribe')
  @UseGuards(ClerkAuthGuard)
  async subscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCheckoutDto,
  ) {
    const url = await this.membershipService.createCheckoutSession(user.id, dto.tier, dto.interval);
    return { url };
  }

  // POST /v1/membership/portal  — returns Stripe billing portal URL
  @Post('portal')
  @UseGuards(ClerkAuthGuard)
  async portal(@CurrentUser() user: AuthenticatedUser) {
    const url = await this.membershipService.createBillingPortal(user.id);
    return { url };
  }
}
