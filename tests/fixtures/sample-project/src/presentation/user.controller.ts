import { UserService } from '../application/user.service';
import { InMemoryUserRepository } from '../infrastructure/in-memory-user.repository';

export class UserController {
  private readonly service: UserService;

  constructor() {
    const repo = new InMemoryUserRepository();
    this.service = new UserService(repo);
  }

  async login(id: string) {
    return this.service.login(id);
  }
}

export { UserService };
