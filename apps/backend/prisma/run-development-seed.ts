import { assertDevelopmentSeedAllowed } from '../src/config/seed-safety';

assertDevelopmentSeedAllowed(process.env);
require('./seed');
