import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const token = this.jwt.sign({ sub: admin.id, email: admin.email });
    return { access_token: token, email: admin.email };
  }

  async createAdmin(email: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    return this.prisma.admin.create({ data: { email, password: hashed } });
  }
}
