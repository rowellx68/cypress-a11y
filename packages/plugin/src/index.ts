import * as axe from 'axe-core';

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Injects the axe-core library into the current window.
       */
      injectAxe(options?: InitOptions): Chainable<void>;

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
      checkA11y(options?: CheckA11yOptions): Chainable<void>;
    }
  }
}

export type InitOptions = {
  axeCorePath?: string;
};

export type CheckA11yOptions = {
  shouldFail?: (violations: axe.Result[], results: axe.AxeResults) => boolean;
  axeRunOptions?: axe.RunOptions;
};

const injectAxe = (options: InitOptions = {}) => {
  const path = options?.axeCorePath || 'node_modules/axe-core/axe.min.js';

  cy.readFile<string>(path).then((content) => {
    cy.window({ log: false }).then((win) => {
      win.eval(content);
      cy.log(`axe-core v${win.axe.version} initialised`);
    });
  });
};

const configureAxe = (options: axe.Spec = {}) => {
  cy.window({ log: false }).then((win) => {
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

const checkA11y = (subject: unknown, options: CheckA11yOptions = {}) => {
  const { shouldFail, axeRunOptions } = {
    shouldFail: (violations: axe.Result[], _results: axe.AxeResults) =>
      violations.length > 0,
    axeRunOptions: {},
    ...options,
  };

  cy.window({ log: false })
    .then((win) => {
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
      if (shouldFail(results.violations, results)) {
        expect(results.violations.length, 'Expected zero violations').to.equal(
          0,
        );
      }
    });
};

Cypress.Commands.add('injectAxe', injectAxe);
Cypress.Commands.add('configureAxe', configureAxe);
Cypress.Commands.add(
  'checkA11y',
  { prevSubject: 'optional' },
  (subject, options) => checkA11y(subject, options),
);
