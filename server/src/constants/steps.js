// Fixed release steps - same for every release
// These are defined once and shared across the application
export const RELEASE_STEPS = [
  'All relevant GitHub pull requests have been merged',
  'CHANGELOG.md files have been updated',
  'All tests are passing',
  'Release in GitHub created',
  'Deployed in demo',
  'Tested thoroughly in demo',
  'Deployed in production',
];

export const TOTAL_STEPS = RELEASE_STEPS.length;
