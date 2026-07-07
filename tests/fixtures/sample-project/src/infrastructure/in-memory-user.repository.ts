import type { User, UserRepository } from '../domain/user.repository';

export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  save(user: User): void {
    this.users.set(user.id, user);
  }
}
