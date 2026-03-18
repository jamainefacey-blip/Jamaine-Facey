import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Shape of the Clerk user payload received via webhook
interface ClerkEmailAddress {
  email_address: string;
  verification?: { status: string };
}

interface ClerkUserPayload {
  id: string;
  email_addresses: ClerkEmailAddress[];
  first_name?: string;
  last_name?: string;
  image_url?: string;
  phone_numbers?: Array<{ phone_number: string; verification?: { status: string } }>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Called on user.created and user.updated Clerk webhook events.
   * Upserts the user record and bootstraps default rows on first create.
   */
  async syncUser(payload: ClerkUserPayload) {
    const primaryEmail = payload.email_addresses[0];
    const email = primaryEmail?.email_address ?? '';
    const emailVerified = primaryEmail?.verification?.status === 'verified';

    const primaryPhone = payload.phone_numbers?.[0];
    const phone = primaryPhone?.phone_number ?? null;
    const phoneVerified = primaryPhone?.verification?.status === 'verified';

    const user = await this.prisma.user.upsert({
      where: { clerkId: payload.id },

      update: {
        email,
        emailVerified,
        phone,
        phoneVerified,
        profile: {
          update: {
            firstName: payload.first_name ?? '',
            lastName: payload.last_name ?? '',
            avatarUrl: payload.image_url ?? null,
          },
        },
      },

      create: {
        clerkId: payload.id,
        email,
        emailVerified,
        phone,
        phoneVerified,
        // Bootstrap default child records on first create
        profile: {
          create: {
            firstName: payload.first_name ?? '',
            lastName: payload.last_name ?? '',
            avatarUrl: payload.image_url ?? null,
          },
        },
        preferences: {
          create: {}, // all defaults from schema
        },
        membership: {
          create: { tier: 'GUEST' }, // every account starts as Guest
        },
      },
    });

    this.logger.log(`Synced user ${user.id} (clerk: ${payload.id})`);

    // STUB: send welcome email via Resend — Phase 3
    // await this.notificationsService.sendWelcomeEmail(user);

    return user;
  }

  /**
   * Called on user.deleted Clerk webhook event.
   * Cascade deletes all user data per GDPR right-to-erasure.
   * Cascade rules defined in schema.prisma.
   */
  async deleteUser(clerkId: string) {
    try {
      await this.prisma.user.delete({ where: { clerkId } });
      this.logger.log(`Deleted user with clerkId ${clerkId}`);
    } catch {
      // User may not exist if webhook fires before sync — safe to ignore
      this.logger.warn(`Delete skipped — user not found: ${clerkId}`);
    }
  }
}
