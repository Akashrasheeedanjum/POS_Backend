import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExtractJwt } from 'passport-jwt';
import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { User } from './schema/user.schemas';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { id: string }) {
    const { id } = payload;

    ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new UnauthorizedException('Login first to access this endpoint');
    }

    return user;
  }
}
