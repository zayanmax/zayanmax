import { assertDemoSeedAllowed } from '../src/config/seed-safety';

assertDemoSeedAllowed(process.env);
require('./demo-seed');
