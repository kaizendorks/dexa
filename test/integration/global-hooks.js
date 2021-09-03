import {
  installTestStacks,
  uninstallTestStacks
} from '../stack-fixtures/index.js';

// Install the default test stacks before any test is run
before(async () => {
  await installTestStacks();
});

// Uninstall the default test stacks at the end of the test run
after(async () => {
  await uninstallTestStacks();
});