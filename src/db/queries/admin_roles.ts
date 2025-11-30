import type { DatabaseClient } from '../client';
import type { User } from '~/types';

export async function getUsersByRole(_db: DatabaseClient, _role: string): Promise<User[]> {
  // Placeholder implementation
  return []; 
}

