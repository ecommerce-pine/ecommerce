import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Verification } from './entities/verification.entity';
import { Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from '../user/user.service';
import { apiBadRequest } from 'src/shared/helpers/api-i18n';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Verification)
    private readonly verifycationRepository: Repository<Verification>,
    private readonly userService: UserService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async verifyEmailCustom(token: string, email: string) {
    const record = await this.verifycationRepository.findOne({
      where: { value: token },
    });

    if (!record) {
      this.logger.warn({ msg: 'auth.verify.tokenNotFound', email });
      apiBadRequest('errors.auth.verificationFailed');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await this.verifycationRepository.delete({
        id: record.id,
      });
      this.logger.warn({ msg: 'auth.verify.tokenExpired', email });
      apiBadRequest('errors.auth.tokenExpired');
    }

    if (record.identifier.toLocaleLowerCase() !== email.toLocaleLowerCase()) {
      this.logger.warn({
        msg: 'auth.verify.emailMismatch',
        tokenEmail: record.identifier,
        providedEmail: email,
      });
      apiBadRequest('errors.auth.emailMistmatch');
    }

    await this.userService.verifyEmail(email);

    await this.verifycationRepository.delete({
      id: record.id,
    });

    this.logger.info({ msg: 'auth.verify.emailVerified', email });
    return { sucess: true, message: 'Email verified successfully', user: null };
  }
}
