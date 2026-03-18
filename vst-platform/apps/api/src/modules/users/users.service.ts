import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { CreateSafetyContactDto } from './dto/create-safety-contact.dto';
import { UpsertPassportDto } from './dto/upsert-passport.dto';

const MAX_SAFETY_CONTACTS_FREE    = 2;
const MAX_SAFETY_CONTACTS_PREMIUM = 5;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true,
        membership: true,
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...(dto.firstName    !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName     !== undefined && { lastName: dto.lastName }),
        ...(dto.displayName  !== undefined && { displayName: dto.displayName }),
        ...(dto.bio          !== undefined && { bio: dto.bio }),
        ...(dto.nationality  !== undefined && { nationality: dto.nationality }),
        ...(dto.dateOfBirth  !== undefined && { dateOfBirth: new Date(dto.dateOfBirth) }),
      },
    });
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    return this.prisma.userPreferences.update({
      where: { userId },
      data: dto as any,
    });
  }

  // ── Safety Contacts ────────────────────────────────────────────────────────

  async getSafetyContacts(userId: string) {
    return this.prisma.safetyContact.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createSafetyContact(userId: string, dto: CreateSafetyContactDto, membershipTier: string) {
    const count = await this.prisma.safetyContact.count({ where: { userId } });

    const limit = membershipTier === 'VOYAGE_ELITE'
      ? Infinity
      : membershipTier === 'PREMIUM'
        ? MAX_SAFETY_CONTACTS_PREMIUM
        : MAX_SAFETY_CONTACTS_FREE;

    if (count >= limit) {
      throw new ForbiddenException(
        `Your plan allows a maximum of ${limit} safety contacts. Upgrade to add more.`,
      );
    }

    // If marking as primary, demote existing primary first
    if (dto.isPrimary) {
      await this.prisma.safetyContact.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.safetyContact.create({
      data: { userId, ...dto },
    });
  }

  async updateSafetyContact(userId: string, contactId: string, dto: Partial<CreateSafetyContactDto>) {
    const contact = await this.prisma.safetyContact.findUnique({ where: { id: contactId } });
    if (!contact || contact.userId !== userId) throw new NotFoundException('Contact not found');

    if (dto.isPrimary) {
      await this.prisma.safetyContact.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.safetyContact.update({
      where: { id: contactId },
      data: dto as any,
    });
  }

  async deleteSafetyContact(userId: string, contactId: string) {
    const contact = await this.prisma.safetyContact.findUnique({ where: { id: contactId } });
    if (!contact || contact.userId !== userId) throw new NotFoundException('Contact not found');
    await this.prisma.safetyContact.delete({ where: { id: contactId } });
  }

  // ── Passport ───────────────────────────────────────────────────────────────

  async getPassport(userId: string) {
    const passport = await this.prisma.passport.findUnique({ where: { userId } });
    if (!passport) throw new NotFoundException('No passport record found');
    // STUB: decrypt passportNumber — Phase 3 adds AES-256 encryption at rest
    return passport;
  }

  async upsertPassport(userId: string, dto: UpsertPassportDto) {
    // STUB: encrypt passportNumber before storage — Phase 3
    return this.prisma.passport.upsert({
      where: { userId },
      update: {
        nationality:     dto.nationality,
        passportNumber:  dto.passportNumber ?? null,
        expiryDate:      new Date(dto.expiryDate),
        alertDaysBefore: dto.alertDaysBefore ?? 90,
      },
      create: {
        userId,
        nationality:     dto.nationality,
        passportNumber:  dto.passportNumber ?? null,
        expiryDate:      new Date(dto.expiryDate),
        alertDaysBefore: dto.alertDaysBefore ?? 90,
      },
    });
  }
}
