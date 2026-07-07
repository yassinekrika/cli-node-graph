export interface UserRepository {
  findById(id: string): Promise<User | null>;
}

export interface User {
  id: string;
  name: string;
}
