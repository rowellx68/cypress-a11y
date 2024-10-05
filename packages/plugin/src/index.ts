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
       * cy.checkA11y();
       * cy.get('custom-element').checkA11y();
       */
      checkAccessibility(options?: CheckA11yOptions): Chainable<void>;
    }
  }
}

export type InjectAxeOptions = {
  path?: string;
};

export type CheckA11yOptions = {
  shouldFail?: (violations: axe.Result[]) => boolean;
  reporters?: CypressAccessibilityReporter[];
  axeRunOptions?: axe.RunOptions;
};

export type CypressAccessibilityReporter = (results: axe.AxeResults) => void;

const injectAxe = (options: InjectAxeOptions = {}) => {
  const path = options?.path || 'node_modules/axe-core/axe.min.js';

  cy.readFile<string>(path).then((content) => {
    cy.window({ log: false }).then((win) => {
      win.eval(content);
      cy.log(`axe-core v${win.axe.version} initialised`);
    });
  });
};

const configureAxe = (options: axe.Spec = {}) => {
  cy.window({ log: false }).then((win) => {
    if (!win.axe) {
      assert.fail('axe-core is not initialised');
    }

    win.axe.configure(options);
  });
};

const runA11y = async (
  run: typeof axe.run,
  context: axe.ElementContext,
  options: axe.RunOptions,
): Promise<axe.AxeResults> => {
  return run(context, options);
};

const checkAccessibility = (
  subject: unknown,
  options: CheckA11yOptions = {},
) => {
  const { shouldFail, axeRunOptions, reporters } = {
    shouldFail: (violations: axe.Result[]) => violations.length > 0,
    reporters: [],
    axeRunOptions: {},
    ...options,
  };

  cy.window({ log: false })
    .then((win) => {
      if (!win.axe) {
        assert.fail('axe-core is not initialised');
      }

      return runA11y(
        win.axe.run,
        (subject as axe.ElementContext) || win.document,
        axeRunOptions,
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
          `Accessibility violations found: ${results.violations.length}`,
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
