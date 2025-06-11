#!/usr/bin/env tsx

import { runIssueReproductionDemo } from './domains/analytics/src/demos/IssueReproductionDemo';

/**
 * Interactive demonstration of centralized logging for issue reproduction
 */
async function main() {
  try {
    await runIssueReproductionDemo();
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  main();
}