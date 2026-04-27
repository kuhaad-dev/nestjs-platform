import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { PasswordService } from '../common/security/password.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  async findAll() {
    return this.userRepository.find({
      select: ['id', 'email', 'createdAt', 'updatedAt'],
    });
  }

  async findById(id: number) {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'createdAt', 'updatedAt'],
    });
  }

  async findByEmailWithPassword(email: string) {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'createdAt', 'updatedAt'],
    });
  }

  async findByIdWithRefreshToken(id: number) {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'refreshTokenHash', 'createdAt', 'updatedAt'],
    });
  }

  async setRefreshTokenHash(userId: number, refreshTokenHash: string | null) {
    await this.userRepository.update(userId, { refreshTokenHash });
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const password = await this.passwordService.hash(createUserDto.password);

    const user = this.userRepository.create({
      email: createUserDto.email,
      password,
    });

    const saved = await this.userRepository.save(user);

    return {
      id: saved.id,
      email: saved.email,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}