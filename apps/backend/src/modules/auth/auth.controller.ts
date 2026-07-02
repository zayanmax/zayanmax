import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequestContextDecorator } from '../../common/decorators/request-context.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
import type { RequestContext } from '../../common/types/request-context.type';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  ChangePasswordDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
} from './dto/password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body() dto: LoginDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.authService.login(dto, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(
      dto.userId,
      dto.refreshToken,
      dto.sessionId,
    );
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUserDecorator() user: CurrentUser) {
    return this.authService.logout(user.id);
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  logoutAll(@CurrentUserDecorator() user: CurrentUser) {
    return this.authService.logoutAll(user.id);
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }

  @Post('password-reset/request')
  requestPasswordReset(
    @Body() dto: PasswordResetRequestDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.authService.requestPasswordReset(dto, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  @Post('password-reset/confirm')
  confirmPasswordReset(@Body() dto: PasswordResetConfirmDto) {
    return this.authService.confirmPasswordReset(dto);
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUserDecorator() user: CurrentUser) {
    return this.authService.me(user.id);
  }
}
