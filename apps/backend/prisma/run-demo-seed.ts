import { assertDemoSeedAllowed } from '../src/config/seed-safety';
import { disconnectDemoSeed, runDemoSeed } from './demo-seed';

assertDemoSeedAllowed(process.env);

runDemoSeed()
  .then(disconnectDemoSeed)
  .catch(async (error: unknown) => {
    console.error(error);
    await disconnectDemoSeed();
    process.exit(1);
  });
