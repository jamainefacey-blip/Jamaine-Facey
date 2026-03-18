import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — must always run AFTER ClerkAuthGuard so that request.user is populated.
 *
 * Usage:
 *   @Roles(UserRole.ADMIN)
 *   @UseGuards(ClerkAuthGuard, RolesGuard)
 *
 * Hierarchy:
 *   ADMIN   → can do anything any role permits
 *   MODERATOR → can do anything MODERATOR permits (not ADMIN-only routes)
 *   USER    → standard authenticated user
 *
 * If no @Roles() decorator is present the guard passes through (open to any authed user).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No role requirement — guard is a no-op (ClerkAuthGuard already enforced auth)
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user?.role) {
      throw new ForbiddenException('Access denied: role not present on request');
    }

    // ADMIN is always allowed
    if (user.role === UserRole.ADMIN) return true;

    if (!required.includes(user.role as UserRole)) {
      throw new ForbiddenException(
        `Access denied: requires role [${required.join(' | ')}]`,
      );
    }

    return true;
  }
}
