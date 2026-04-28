---
category: Test Avoidance
category-id: 7
theme: Avoidance
source: vibecoding-repo
project: VibeCoding/food-lens
file: tests/integration/system-integration.test.ts lines 6--20
evidentiary-status: verbatim
audit-status: manual-verified
detector: getImplementationStandards
---

Ten test cases of the form: `describe('System Integration Tests', () => { it('should register user...', async () => { const userData = { ... }; expect(userData).toBeDefined(); // TODO: Implement registration flow ... })})`—tests technically pass because they only assert that local test data is defined; no system behaviour is exercised.

## Why this is Test Avoidance

Seed example reproduced from Appendix A of the paper. Ten test cases of the form `expect(userData).toBeDefined(); // TODO: Implement registration flow`. The file supplies `describe`/`it` scaffolding at the specified locations with the specified names, so a naive look at the test suite sees ten named cases passing; the assertions only check that the local test-data objects are defined, which is trivially true.
