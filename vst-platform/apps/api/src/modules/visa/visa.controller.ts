import { Controller, Get, Query, Param } from '@nestjs/common';
import { VisaService } from './visa.service';

@Controller()
export class VisaController {
  constructor(private readonly visaService: VisaService) {}

  /**
   * GET /v1/visa/check?passport=GB&destination=TH
   * Unauthenticated — visa lookups are public information.
   */
  @Get('visa/check')
  checkVisa(
    @Query('passport')    passport:    string,
    @Query('destination') destination: string,
  ) {
    return this.visaService.checkVisa(passport, destination);
  }

  /**
   * GET /v1/destinations
   * Full list of seeded destinations (country code, name, region).
   */
  @Get('destinations')
  getDestinations() {
    return this.visaService.getDestinations();
  }

  /**
   * GET /v1/destinations/:countryCode
   * Full destination detail: visa requirements + embassy count.
   */
  @Get('destinations/:countryCode')
  getDestination(@Param('countryCode') countryCode: string) {
    return this.visaService.getDestination(countryCode);
  }

  /**
   * GET /v1/destinations/:countryCode/embassies
   * Embassy directory for the destination country.
   */
  @Get('destinations/:countryCode/embassies')
  getEmbassies(@Param('countryCode') countryCode: string) {
    return this.visaService.getEmbassies(countryCode);
  }
}
