import type {
  Spec as AxeSpec,
  Result,
  ElementContext,
  RunOptions,
  run,
  UnlabelledFrameSelector,
  AxeResults,
} from 'axe-core';

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
      configureAxe(options?: AxeSpec): Chainable<void>;

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
  shouldFail?: (violations: Result[], results: AxeResults) => boolean;
  axeRunOptions?: RunOptions;
};

const injectAxe = (options: InitOptions = {}) => {
  const path = options?.axeCorePath || 'node_modules/axe-core/axe.min.js';

  cy.readFile<string>(path, { log: false }).then((content) => {
    cy.window({ log: false }).then((win) => {
      win.eval(content);
      cy.log(`axe-core v${win.axe.version} injected from '${path}'`);
    });
  });
};

const configureAxe = (options: AxeSpec = {}) => {
  cy.window({ log: false }).then((win) => {
    win.axe.configure(options);
  });
};

const runA11y = async (
  axeRun: typeof run,
  context: ElementContext,
  options: RunOptions,
): Promise<AxeResults> => {
  return axeRun(context, options);
};

const checkA11y = (subject: unknown, options: CheckA11yOptions = {}) => {
  const { shouldFail, axeRunOptions } = {
    shouldFail: (violations: Result[], _results: AxeResults) =>
      violations.length > 0,
    axeRunOptions: {},
    ...options,
  };

  cy.window({ log: false })
    .then((win) => {
      return runA11y(
        win.axe.run,
        (subject as ElementContext) || win.document,
        axeRunOptions,
      );
    })
    .then((results) => {
      if (results.violations.length > 0) {
        results.violations.forEach((violation) => {
          const selectors = violation.nodes
            .reduce<
              UnlabelledFrameSelector[]
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
