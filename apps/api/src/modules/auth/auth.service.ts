import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// In-memory user store for demo (used when database is unavailable)
const demoUsers: Map<string, any> = new Map([
  [
    'demo@trycarpal.com',
    {
      id: 'demo-user-1',
      email: 'demo@trycarpal.com',
      name: 'Demo User',
      phone: null,
      passwordHash: bcrypt.hashSync('customer123', 12),
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: new Date(),
    },
  ],
  [
    'admin@trycarpal.com',
    {
      id: 'admin-user-1',
      email: 'admin@trycarpal.com',
      name: 'Admin User',
      phone: null,
      passwordHash: bcrypt.hashSync('admin123', 12),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: new Date(),
    },
  ],
]);

let useInMemoryStore = false;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async checkDatabase(): Promise<boolean> {
    if (useInMemoryStore) return false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      useInMemoryStore = true;
      console.log('Database unavailable, using in-memory auth store');
      return false;
    }
  }

  async register(dto: RegisterDto) {
    const dbAvailable = await this.checkDatabase();

    if (!dbAvailable) {
      // In-memory registration
      if (demoUsers.has(dto.email)) {
        throw new ConflictException('Email already registered');
      }

      const passwordHash = await bcrypt.hash(dto.password, 12);
      const user = {
        id: `user-${Date.now()}`,
        email: dto.email,
        name: dto.name,
        phone: dto.phone || null,
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: false,
        createdAt: new Date(),
      };

      demoUsers.set(dto.email, user);

      const token = this.generateToken(user.id, user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        token,
      };
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        passwordHash,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id, user.role);

    return { user, token };
  }

  async login(dto: LoginDto) {
    const dbAvailable = await this.checkDatabase();

    if (!dbAvailable) {
      // In-memory login
      const user = demoUsers.get(dto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = this.generateToken(user.id, user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        token,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      token,
    };
  }

  async validateUser(userId: string) {
    const dbAvailable = await this.checkDatabase();

    if (!dbAvailable) {
      // In-memory validation
      for (const user of demoUsers.values()) {
        if (user.id === userId) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
          };
        }
      }
      throw new UnauthorizedException('User not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async googleAuth(googleToken: string) {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    let payload: any;
    try {
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    const { email, name } = payload;
    const dbAvailable = await this.checkDatabase();

    if (!dbAvailable) {
      // In-memory Google auth
      let user = demoUsers.get(email);

      if (!user) {
        const randomPassword = Math.random().toString(36).slice(-20);
        const passwordHash = await bcrypt.hash(randomPassword, 12);

        user = {
          id: `google-user-${Date.now()}`,
          email,
          name: name || 'Google User',
          phone: null,
          passwordHash,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: true,
          createdAt: new Date(),
        };

        demoUsers.set(email, user);
      }

      const token = this.generateToken(user.id, user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        token,
      };
    }

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    let userId: string;
    let userRole: string;
    let userName: string;
    let userPhone: string | null;

    if (existingUser) {
      userId = existingUser.id;
      userRole = existingUser.role;
      userName = existingUser.name;
      userPhone = existingUser.phone;
    } else {
      // Create new user with Google profile
      const randomPassword = Math.random().toString(36).slice(-20);
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      const newUser = await this.prisma.user.create({
        data: {
          email,
          name: name || 'Google User',
          passwordHash,
          role: 'CUSTOMER',
          emailVerified: true,
        },
      });

      userId = newUser.id;
      userRole = newUser.role;
      userName = newUser.name;
      userPhone = newUser.phone;
    }

    const token = this.generateToken(userId, userRole);

    return {
      user: {
        id: userId,
        email,
        name: userName,
        phone: userPhone,
        role: userRole,
      },
      token,
    };
  }

  private generateToken(userId: string, role: string): string {
    return this.jwtService.sign({ sub: userId, role });
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    const dbAvailable = await this.checkDatabase();

    if (!dbAvailable) {
      // In-memory update
      for (const user of demoUsers.values()) {
        if (user.id === userId) {
          if (data.name !== undefined) user.name = data.name;
          if (data.phone !== undefined) user.phone = data.phone || null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
          };
        }
      }
      throw new UnauthorizedException('User not found');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return user;
  }
}
