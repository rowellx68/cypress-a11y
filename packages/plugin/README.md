# cypress-a11y-report

![MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![CI](https://img.shields.io/github/actions/workflow/status/rowellx68/cypress-a11y-report/publish.yml?style=flat-square&label=Build%20and%20Publish)
<a href="https://www.npmjs.com/package/cypress-a11y-report">
![NPM](https://img.shields.io/npm/v/cypress-a11y-report?style=flat-square&label=Version)
</a>

Yet another Cypress plugin for accessibility testing powered by [axe-core®](https://github.com/dequelabs/axe-core). This is a fork of [cypress-axe](https://github.com/component-driven/cypress-axe) with some api changes and improvements.

<img title="Cypress basic demo" alt="Cypress showing results of a basic accessibility test against a sample website" src="https://github.com/rowellx68/cypress-a11y-report/blob/main/docs/assets/basic-demo-v1-1-0.png?raw=true" />

Axe-core® is a trademark of Deque Systems, Inc. in the US and other countries. This plugin is not affiliated with or endorsed by Deque Systems, Inc.

If you're looking to migrate from `cypress-axe`, you can find the migration guide [here](https://github.com/rowellx68/cypress-a11y-report/blob/main/docs).

> Previously published as `cypress-accessibility`. It has been renamed to `cypress-a11y-report` to avoid confusion with the official [Cypress Accessibility](https://www.cypress.io/blog/introducing-cypress-accessibility/) feature.

## Installation

This plugin **only** works with Cypress version 10.0.0 or higher.

```bash
# pnpm
pnpm add cypress axe-core cypress-a11y-report -D

# npm
npm install cypress axe-core cypress-a11y-report -D
```

## Configuration

Add the following to your `cypress/support/e2e.ts` file:

```ts
import 'cypress-a11y-report';
```

### TypeScript

If you are using TypeScript, you need to add the following to your `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "types": ["cypress", "cypress-a11y-report"]
  }
}
```

## Cypress Commands

### `cy.injectAxe()`

Injects axe-core® into the current window and initializes it. This command should be called before any other `cypress-a11y-report` commands.

```ts
cy.injectAxe();

// or
cy.injectAxe({
  path: 'custom-path/axe-core/axe.min.js',
});
```

#### Options

| Name   | Type     | Default                              | Description                        |
| ------ | -------- | ------------------------------------ | ---------------------------------- |
| `path` | `string` | `'node_modules/axe-core/axe.min.js'` | The path to the axe-core® script. |

### `cy.configureAxe()`

Configures axe-core® with the given options.

```ts
cy.configureAxe({
  rules: [{ id: 'color-contrast', enabled: false }],
});
```

#### Options

This accepts the same options as the `axe.configure()` method. You can find the full list of options [here](https://github.com/dequelabs/axe-core/blob/master/axe.d.ts#L244-L257).

### `cy.checkAccessibility()`

Runs axe-core® against the current document or a given element.

```ts
// Check the entire document
cy.checkAccessibility();

// Check a specific element
cy.get('button').checkAccessibility();

// Check the entire document with options
cy.checkAccessibility({
  shouldFail: (violations) => violations.length > 0,
  runOptions: {
    rules: {
      'color-contrast': { enabled: false },
    },
  },
  reporters: [(results) => console.table(results.violations)],
});

// Check a specific element with options
cy.get('button').checkAccessibility({
  shouldFail: (violations) => violations.length > 0,
  runOptions: {
    rules: {
      'color-contrast': { enabled: false },
    },
  },
  reporters: [(results) => console.table(results.violations)],
});
```

#### Options

| Name         | Type                                                                                     | Default                                 | Description                                                                 |
| ------------ | ---------------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `shouldFail` | `(violations: axe.Result[]) => boolean`                                                  | `(violations) => violations.length > 0` | A function that determines if the test should fail based on the violations. |
| `runOptions` | [`axe.RunOptions`](https://github.com/dequelabs/axe-core/blob/master/axe.d.ts#L134-L149) | `{}`                                    | The options to pass to the `axe.run()` method.                              |
| `reporters`  | `((results: AxeResults) => void)[]`                                                      | `[]`                                    | An array of functions that will be called with the results.                 |
| `retry`      | `{ interval: number, times: number }`                                                    | `{ interval: 500, times: 0 }`           | The interval and number of times to retry the check if it fails.            |

## Acknowledgements

This plugin is heavily based on [cypress-axe](https://github.com/component-driven/cypress-axe). I would like to thank the maintainers and contributors of that project for their hard work.

I would also like to thank the maintainers and contributors of [axe-core®](https://github.com/dequelabs/axe-core) for their hard work on the axe-core® library.

## License

MIT
