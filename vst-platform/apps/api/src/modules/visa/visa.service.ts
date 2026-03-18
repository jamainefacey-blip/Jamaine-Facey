import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  DESTINATION_SEEDS,
  VISA_SEEDS,
  EMBASSY_SEEDS,
} from './data/destinations.data';

// ── Disclaimer — required on every visa response ──────────────────────────────
const VISA_DISCLAIMER =
  'Visa requirements are subject to change without notice. Always verify ' +
  'with the official embassy, consulate, or government source before travelling. ' +
  'Voyage Smart Travel accepts no liability for inaccurate or outdated information.';

@Injectable()
export class VisaService implements OnModuleInit {
  private readonly logger = new Logger(VisaService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Seed on startup (idempotent) ────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    await this.seedDestinations();
    this.logger.log('Visa/Embassy seed complete');
  }

  private async seedDestinations(): Promise<void> {
    for (const dest of DESTINATION_SEEDS) {
      const record = await this.prisma.destination.upsert({
        where:  { countryCode: dest.countryCode },
        create: { countryCode: dest.countryCode, countryName: dest.countryName, region: dest.region },
        update: { countryName: dest.countryName, region: dest.region },
      });

      // Visa requirements
      const visas = VISA_SEEDS.filter(v => v.destinationCode === dest.countryCode);
      for (const v of visas) {
        await this.prisma.visaRequirement.upsert({
          where: {
            destinationId_passportNationality: {
              destinationId:       record.id,
              passportNationality: v.passportNationality,
            },
          },
          create: {
            destinationId:       record.id,
            passportNationality: v.passportNationality,
            visaType:            v.visaType,
            maxStayDays:         v.maxStayDays,
            notes:               v.notes,
            officialUrl:         v.officialUrl,
            lastVerifiedAt:      v.lastVerifiedAt ? new Date(v.lastVerifiedAt) : null,
          },
          update: {
            visaType:       v.visaType,
            maxStayDays:    v.maxStayDays,
            notes:          v.notes,
            officialUrl:    v.officialUrl,
            lastVerifiedAt: v.lastVerifiedAt ? new Date(v.lastVerifiedAt) : null,
          },
        });
      }

      // Embassies (upsert by name + destinationId)
      const embassies = EMBASSY_SEEDS.filter(e => e.destinationCode === dest.countryCode);
      for (const e of embassies) {
        const existing = await this.prisma.embassy.findFirst({
          where: { destinationId: record.id, name: e.name },
        });
        if (!existing) {
          await this.prisma.embassy.create({
            data: {
              destinationId: record.id,
              name:          e.name,
              address:       e.address,
              phone:         e.phone,
              email:         e.email,
              website:       e.website,
              emergencyLine: e.emergencyLine,
            },
          });
        }
      }
    }
  }

  // ── GET /v1/visa/check?passport=GB&destination=TH ──────────────────────────

  async checkVisa(passportNationality: string, destinationCode: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { countryCode: destinationCode.toUpperCase() },
    });
    if (!destination) throw new NotFoundException(`Destination '${destinationCode}' not found`);

    const requirement = await this.prisma.visaRequirement.findUnique({
      where: {
        destinationId_passportNationality: {
          destinationId:       destination.id,
          passportNationality: passportNationality.toUpperCase(),
        },
      },
    });

    return {
      passportNationality: passportNationality.toUpperCase(),
      destination:         { countryCode: destination.countryCode, countryName: destination.countryName },
      visaRequirement:     requirement
        ? {
            visaType:       requirement.visaType,
            maxStayDays:    requirement.maxStayDays,
            notes:          requirement.notes,
            officialUrl:    requirement.officialUrl,
            lastVerifiedAt: requirement.lastVerifiedAt,
          }
        : null,
      disclaimer:   VISA_DISCLAIMER,
      lastVerified: requirement?.lastVerifiedAt ?? null,
    };
  }

  // ── GET /v1/destinations ───────────────────────────────────────────────────

  async getDestinations() {
    const destinations = await this.prisma.destination.findMany({
      orderBy: { countryName: 'asc' },
      select: {
        countryCode: true,
        countryName: true,
        region:      true,
        updatedAt:   true,
      },
    });

    return {
      destinations,
      disclaimer: VISA_DISCLAIMER,
    };
  }

  // ── GET /v1/destinations/:countryCode ─────────────────────────────────────

  async getDestination(countryCode: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { countryCode: countryCode.toUpperCase() },
      include: {
        visaRequirements: true,
        embassies:        true,
      },
    });
    if (!destination) throw new NotFoundException(`Destination '${countryCode}' not found`);

    return {
      countryCode:      destination.countryCode,
      countryName:      destination.countryName,
      region:           destination.region,
      visaRequirements: destination.visaRequirements.map(v => ({
        passportNationality: v.passportNationality,
        visaType:            v.visaType,
        maxStayDays:         v.maxStayDays,
        notes:               v.notes,
        officialUrl:         v.officialUrl,
        lastVerifiedAt:      v.lastVerifiedAt,
      })),
      embassyCount: destination.embassies.length,
      disclaimer:   VISA_DISCLAIMER,
    };
  }

  // ── GET /v1/destinations/:countryCode/embassies ───────────────────────────

  async getEmbassies(countryCode: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { countryCode: countryCode.toUpperCase() },
      include: { embassies: true },
    });
    if (!destination) throw new NotFoundException(`Destination '${countryCode}' not found`);

    return {
      destination: { countryCode: destination.countryCode, countryName: destination.countryName },
      embassies:   destination.embassies.map(e => ({
        name:          e.name,
        address:       e.address,
        phone:         e.phone,
        email:         e.email,
        website:       e.website,
        emergencyLine: e.emergencyLine,
        latitude:      e.latitude,
        longitude:     e.longitude,
        updatedAt:     e.updatedAt,
      })),
      disclaimer: VISA_DISCLAIMER,
    };
  }
}
