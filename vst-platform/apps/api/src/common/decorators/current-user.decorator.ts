import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User, Membership } from '@prisma/client';

export type AuthenticatedUser = User & { membership: Membership | null };

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
