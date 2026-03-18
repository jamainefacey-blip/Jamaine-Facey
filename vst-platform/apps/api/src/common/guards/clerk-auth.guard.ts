import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No bearer token provided');
    }

    try {
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // Verify JWT against Clerk's JWKS — no DB call, cryptographic verification only
      const payload = await clerk.verifyToken(token);

      // Fetch our internal user record — attach to request for use in controllers
      const user = await this.prisma.user.findUnique({
        where: { clerkId: payload.sub },
        include: { membership: true },
      });

      if (!user) {
        // User exists in Clerk but not yet synced — possible webhook lag
        throw new UnauthorizedException('User account not found. Please try again.');
      }

      request.user = user;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Token validation failed');
    }
  }

  private extractToken(req: any): string | null {
    const authHeader: string = req.headers?.authorization ?? '';
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
