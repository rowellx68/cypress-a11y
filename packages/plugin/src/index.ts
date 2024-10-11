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
  /**
   * The path to the axe-core library.
   * @default 'node_modules/axe-core/axe.min.js'
   */
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
  runOptions?: axe.RunOptions;
};

export type RetryOptions =
  | {
      /**
       * The interval in milliseconds to wait between retries.
       * @default 500
       */
      interval: number;

      /**
       * The maximum number of retries.
       * @default 0
       */
      limit: number;
    }
  | {
      /**
       * The interval in milliseconds to wait between retries.
       * @default 500
       */
      interval?: number;

      /**
       * The maximum number of retries.
       * @default 0
       */
      limit: number;
    };

export type CypressAccessibilityReporter = (results: axe.AxeResults) => void;

const pluralise = (count: number, word: string) => {
  return count === 1 ? word : `${word}s`;
};

const injectAxe = (options: InjectAxeOptions = {}) => {
  const path = options?.path || 'node_modules/axe-core/axe.min.js';

  cy.readFile<string>(path).then((content) => {
    cy.window({ log: false }).then((win) => {
      win.eval(content);

      Cypress.log({
        name: 'injectAxe',
        message: `axe-core v${win.axe.version} initialised`,
        type: 'parent',
      });
    });
  });
};

const configureAxe = (options: axe.Spec = {}) => {
  cy.window({ log: false }).then((win) => {
    if (!win.axe) {
      assert.fail('cypress-a11y-report: axe-core is not initialised');
    }

    win.axe.configure(options);

    Cypress.log({
      name: 'configureAxe',
      message: 'axe-core configured',
      type: 'parent',
      consoleProps: () => ({ options }),
    });
  });
};

const runA11y = async (
  run: typeof axe.run,
  context: axe.ElementContext,
  options: axe.RunOptions,
  retry: Required<RetryOptions>,
): Promise<axe.AxeResults> => {
  return run(context, options).then((results) => {
    const limitAbsolute = Math.abs(retry.limit);
    const intervalAbsolute = Math.abs(retry.interval);

    if (results.violations.length === 0) {
      return results;
    }

    if (limitAbsolute === 0) {
      return results;
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const limit = limitAbsolute - 1;

        Cypress.log({
          name: 'checkAccessibility',
          message: `${pluralise(results.violations.length, 'violation')} found, retrying checks (${limit} ${pluralise(limit, 'attempt')} remaining)`,
          consoleProps: () => ({ violations: results.violations, retry }),
        });
        resolve(
          runA11y(run, context, options, {
            ...retry,
            limit,
          }),
        );
      }, intervalAbsolute);
    });
  });
};

const checkAccessibility = (
  subject: unknown,
  options: CheckA11yOptions = {},
) => {
  const { shouldFail, runOptions, reporters, retry } = {
    shouldFail: !options.shouldFail
      ? (violations: axe.Result[]) => violations.length > 0
      : options.shouldFail,
    reporters: options.reporters || [],
    runOptions: options.runOptions || {},
    retry: {
      interval: 500,
      limit: 0,
      ...(options.retry || {}),
    } as Required<RetryOptions>,
  };

  cy.window({ log: false })
    .then((win) => {
      if (!win.axe) {
        assert.fail('cypress-a11y-report: axe-core is not initialised');
      }

      const target = subject || win.document;

      Cypress.log({
        name: 'checkAccessibility',
        message:
          (subject as Cypress.JQueryWithSelector)?.selector || 'document',
        type: subject ? 'child' : 'parent',
        consoleProps: () => ({ target: target }),
      });

      return runA11y(
        win.axe.run,
        target as axe.ElementContext,
        runOptions,
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
            message: violation.help,
            $el: Cypress.$(selectors),
            consoleProps: () => ({ violation }),
          });
        });
      }

      return cy.wrap(results, { log: false });
    })
    .then((results) => {
      reporters.forEach((reporter) => reporter(results));

      if (shouldFail(results.violations)) {
        const totalRuns = Math.abs(retry.limit) + 1;

        assert.fail(
          `accessibility ${pluralise(results.violations.length, 'violation')} found (${results.violations.length}) after ${totalRuns} ${pluralise(totalRuns, 'run')}`,
        );
      }
    });
};

Cypress.Commands.add('injectAxe', injectAxe);
Cypress.Commands.add('configureAxe', configureAxe);
Cypress.Commands.add(
  'checkAccessibility',
  { prevSubject: ['optional', 'element'] },
  (subject, options) => checkAccessibility(subject, options),
);
