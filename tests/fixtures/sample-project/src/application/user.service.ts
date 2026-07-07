import type { User, UserRepository } from '../domain/user.repository';

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async login(id: string): Promise<User | null> {
    return this.repository.findById(id);
  }
}
