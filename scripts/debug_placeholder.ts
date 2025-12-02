
import { createDatabaseClient } from '../src/db/client';
import { findUserByUsername, findUserByTelegramId } from '../src/db/queries/users';

async function main() {
  // Use local dev or staging? User is on staging. 
  // We can't easily connect to remote D1 from local script without wrangler d1 execute.
  // So I should use `wrangler d1 execute` command directly.
  console.log('Use wrangler d1 execute instead.');
}

// main();

