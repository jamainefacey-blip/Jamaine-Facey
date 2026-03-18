import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'vst_required_roles';

/**
 * Attach required roles to a route handler or controller.
 * Must be paired with RolesGuard (which runs AFTER ClerkAuthGuard).
 *
 * @example
 *   @Roles(UserRole.ADMIN)
 *   @UseGuards(ClerkAuthGuard, RolesGuard)
 *   @Patch('admin/foo')
 *   doAdminThing() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
