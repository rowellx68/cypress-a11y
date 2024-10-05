import * as axe from 'axe-core';

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Injects the axe-core library into the current window.
       */
      injectAxe(options?: InjectAxeOptions): Chainable<void>;

      /**
       * Configures the axe-core library with the given options.
       */
      configureAxe(options?: axe.Spec): Chainable<void>;

      /**
       * Runs an accessibility check on the current window or a specific element.
       *
       * @example
       * cy.checkAccessibility();
       * cy.get('custom-element').checkAccessibility();
       */
      checkAccessibility(options?: CheckA11yOptions): Chainable<void>;
    }
  }
}

export type InjectAxeOptions = {
  path?: string;
};

export type CheckA11yOptions = {
  /**
   * A function that determines whether the test should fail based on the violations found by axe-core.
   * @param violations a list of violations found by axe-core
   * @returns boolean whether the test should fail
   * @default (violations) => violations.length > 0
   */
  shouldFail?: (violations: axe.Result[]) => boolean;

  /**
   * A list of reporters that will be called with the axe-core results.
   * @default []
   */
  reporters?: CypressAccessibilityReporter[];

  /**
   * Retry options for the accessibility check.
   * @default { interval: 500, limit: 2 }
   */
  retry?: RetryOptions;

  /**
   * Options to pass to the axe-core run method.
   */
  axeRunOptions?: axe.RunOptions;
};

export type RetryOptions = {
  /**
   * The interval in milliseconds to wait between retries.
   * @default 500
   */
  interval?: number;

  /**
   * The maximum number of retries.
   * @default 2
   */
  limit?: number;
};

export type CypressAccessibilityReporter = (results: axe.AxeResults) => void;

const injectAxe = (options: InjectAxeOptions = {}) => {
  const path = options?.path || 'node_modules/axe-core/axe.min.js';

  cy.readFile<string>(path).then((content) => {
    cy.window({ log: false }).then((win) => {
      win.eval(content);
      Cypress.log({
        name: 'cypress-accessibility',
        message: `axe-core v${win.axe.version} initialised`,
        type: 'parent',
      });
    });
  });
};

const configureAxe = (options: axe.Spec = {}) => {
  cy.window({ log: false }).then((win) => {
    if (!win.axe) {
      assert.fail('cypress-accessibility: axe-core is not initialised');
    }

    win.axe.configure(options);
  });
};

const runA11y = async (
  run: typeof axe.run,
  context: axe.ElementContext,
  options: axe.RunOptions,
  retry: Required<RetryOptions> = { interval: 500, limit: 0 },
): Promise<axe.AxeResults> => {
  return run(context, options).then((results) => {
    if (results.violations.length === 0) {
      return results;
    }

    if (retry.limit === 0) {
      return results;
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const limit = retry.limit - 1;

        Cypress.log({
          name: 'cypress-accessibility',
          message: `retrying accessibility check (${limit} attempt${limit === 1 ? '' : 's'} remaining)`,
          type: 'parent',
        });
        resolve(runA11y(run, context, options, { ...retry, limit }));
      }, retry.interval);
    });
  });
};

const checkAccessibility = (
  subject: unknown,
  options: CheckA11yOptions = {},
) => {
  const { shouldFail, axeRunOptions, reporters, retry } = {
    shouldFail: !options.shouldFail
      ? (violations: axe.Result[]) => violations.length > 0
      : options.shouldFail,
    reporters: options.reporters || [],
    axeRunOptions: options.axeRunOptions || {},
    retry: {
      interval: 500,
      limit: 0,
      ...(options.retry || {}),
    } as Required<RetryOptions>,
  };

  cy.window({ log: false })
    .then((win) => {
      if (!win.axe) {
        assert.fail('cypress-accessibility: axe-core is not initialised');
      }

      return runA11y(
        win.axe.run,
        (subject as axe.ElementContext) || win.document,
        axeRunOptions,
        retry,
      );
    })
    .then((results) => {
      if (results.violations.length > 0) {
        results.violations.forEach((violation) => {
          const selectors = violation.nodes
            .reduce<
              axe.UnlabelledFrameSelector[]
            >((acc, node) => acc.concat(node.target), [])
            .join(', ');

          Cypress.log({
            name: `a11y violation (${violation.impact}): ${violation.id}`,
            type: 'parent',
            message: violation.help,
            $el: Cypress.$(selectors),
            consoleProps: () => violation,
          });
        });
      }

      return cy.wrap(results, { log: false });
    })
    .then((results) => {
      if (shouldFail(results.violations)) {
        assert.fail(
          `accessibility violation${results.violations.length === 1 ? '' : 's'} found (${results.violations.length}) after ${retry.limit + 1} run${retry.limit === 0 ? '' : 's'}`,
        );
      }

      reporters.forEach((reporter) => reporter(results));
    });
};

Cypress.Commands.add('injectAxe', injectAxe);
Cypress.Commands.add('configureAxe', configureAxe);
Cypress.Commands.add(
  'checkAccessibility',
  { prevSubject: ['optional', 'element'] },
  (subject, options) => checkAccessibility(subject, options),
);
