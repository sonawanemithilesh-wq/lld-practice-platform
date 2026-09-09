import { createApp } from './app.js';
import { seedDatabase } from './seed/seedProblems.js';
import { getDatabase } from './db/connection.js';
import { SqliteProblemRepository } from './repositories/ProblemRepository.js';

const PORT = process.env.PORT || 3001;

async function start() {
  const db = getDatabase();
  const problemRepo = new SqliteProblemRepository(db);

  // Auto-seed if problems table is empty
  const existing = problemRepo.findAll();
  if (existing.length === 0) {
    console.log('Database empty, seeding default LLD problems...');
    seedDatabase();
  }

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`  LLD Practice Platform Backend Running  `);
    console.log(`  URL: http://localhost:${PORT}          `);
    console.log(`  Health: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
