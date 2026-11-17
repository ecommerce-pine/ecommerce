import { BadRequestException, NotFoundException } from '@nestjs/common';

const messages: Record<string, string> = {
  'errors.common.userNotFound': 'User not found',
  'errors.auth.verificationFailed': 'Email verification failed',
  'errors.auth.tokenExpired': 'Verification token has expired',
  'errors.auth.emailMistmatch': 'Email does not match the verification token',
};

export function translateApiMessage(key: string): string {
  return messages[key] ?? key;
}

export function apiBadRequest(key: string): never {
  throw new BadRequestException(translateApiMessage(key));
}

export function apiNotFound(key: string): never {
  throw new NotFoundException(translateApiMessage(key));
}
