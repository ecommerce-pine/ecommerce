import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { SessionAuthService } from './session-auth/session-auth.service';
import { User } from '../user/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from '../user/dto/user-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly sessionAuth: SessionAuthService,
  ) {}

  private mapUserResponse(user: User) {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true, // keep only fields marked with @Expose() -> without this, @Expose() will not work
    });
  }

  private async sessionFromRequest(req: { headers: any }) {
    const ctx = await this.sessionAuth.resolveSessionContext(req.headers);

    if (!ctx) return null;

    return {
      user: this.mapUserResponse(ctx.user),
      session: {
        token: ctx.session.token,
        expiresAt: ctx.session.expiresAt,
      },
    };
  }

  @Get('verify-email')
  async verifyEmail(
    @Query('token') token: string,
    @Query('email') email: string,
  ) {
    return this.authService.verifyEmailCustom(token, email);
  }

  @Get('me')
  async getCurrentUser(@Req() req: any) {
    const session = await this.sessionFromRequest(req);

    if (!session?.user)
      return {
        success: false,
        authenticated: false,
        message: 'User not authenticated',
        user: null,
      };

    const fullUser = await this.userService.getUser(session.user.id);

    return {
      success: true,
      authenticated: true,
      message: 'User authenticated',
      user: fullUser ? this.mapUserResponse(fullUser) : session.user,
    };
  }

  @Get('session')
  async getSession(@Req() req: any) {
    const session = await this.sessionFromRequest(req);

    if (!session)
      return {
        success: false,
        authenticated: false,
      };

    return {
      success: true,
      authenticated: true,
      session: {
        token: session.session.token,
        expiresAt: session.session.expiresAt,
      },
      user: session.user,
      message: 'User authenticated',
    };
  }

  @Get('check')
  @HttpCode(HttpStatus.OK)
  async checkAuth(@Req() req: any) {
    const session = await this.sessionFromRequest(req);

    if (!session?.user) {
      return {
        authenticated: false,
        user: null,
      };
    }

    return {
      authenticated: true,
      user: session.user,
    };
  }
}
