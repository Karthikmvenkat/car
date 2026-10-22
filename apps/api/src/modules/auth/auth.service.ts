import { Injectable, UnauthorizedException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const publicUserSelect = {
  id: true, email: true, name: true, phone: true, role: true,
  status: true, emailVerified: true, createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  private async database<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw new ServiceUnavailableException('Authentication is temporarily unavailable');
    }
  }

  private requireActive(status: UserStatus): void {
    if (status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');
  }

  async register(dto: RegisterDto) {
    const existing = await this.database(() => this.prisma.user.findUnique({ where: { email: dto.email } }));
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.database(() => this.prisma.user.create({
      data: { email: dto.email, name: dto.name, phone: dto.phone, passwordHash, role: 'CUSTOMER' },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    }));
    return { user, token: this.generateToken(user.id, user.role) };
  }

  async login(dto: LoginDto) {
    const user = await this.database(() => this.prisma.user.findUnique({ where: { email: dto.email } }));
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    this.requireActive(user.status);
    return {
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
      token: this.generateToken(user.id, user.role),
    };
  }

  async validateUser(userId: string) {
    const user = await this.database(() => this.prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect }));
    if (!user) throw new UnauthorizedException('User not found');
    this.requireActive(user.status);
    return user;
  }

  async googleAuth(googleToken: string) {
    const audience = process.env.GOOGLE_CLIENT_ID;
    if (!audience) throw new ServiceUnavailableException('Google sign-in is not configured');
    const client = new OAuth2Client(audience);
    let payload;
    try {
      payload = (await client.verifyIdToken({ idToken: googleToken, audience })).getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
    if (!payload?.email || payload.email_verified !== true) {
      throw new UnauthorizedException('Invalid Google token payload');
    }
    const email = payload.email;
    let user = await this.database(() => this.prisma.user.findUnique({ where: { email } }));
    if (!user) {
      const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
      user = await this.database(() => this.prisma.user.create({
        data: { email, name: payload.name || 'Google User', passwordHash, role: 'CUSTOMER', emailVerified: true },
      }));
    }
    this.requireActive(user.status);
    return {
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
      token: this.generateToken(user.id, user.role),
    };
  }

  private generateToken(userId: string, role: string): string {
    return this.jwtService.sign({ sub: userId, role });
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    return this.database(() => this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
      select: publicUserSelect,
    }));
  }
}
