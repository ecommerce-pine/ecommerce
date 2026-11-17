import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async verifyEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) throw new NotFoundException('User not found');

    return this.userRepository.update(
      {
        id: user.id,
      },
      {
        emailVerified: true,
      },
    );
  }

  getUser(id: string) {
    return this.userRepository.findOne({
      where: { id },
    });
  }
}
