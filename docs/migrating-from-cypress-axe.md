# Migrating from `cypress-axe`

This guide will help you migrate from `cypress-axe` to `cypress-a11y-report`. Since the two plugins both use `axe-core`, the migration should be relatively straightforward.

## Steps

1. Install `cypress-a11y-report` and uninstall `cypress-axe`
2. Update your references to `cypress-axe` to `cypress-a11y-report`
   - Update your `cypress/support/e2e.js` or `cypress/support/e2e.ts` file
   - Update your `tsconfig.json` file (if using TypeScript)
3. Update your usage of the `cypress-axe` commands to the `cypress-a11y-report` commands

## Update commands

### `cy.injectAxe()`

If you are not passing any options to `cy.injectAxe()`, you do not need to make any changes. If you are passing options, you will need to update the `axeCorePath` option to `path`.

```diff
cy.injectAxe({
-  axeCorePath: 'node_modules/axe-core/axe.min.js',
+  path: 'node_modules/axe-core/axe.min.js',
});
```

### `cy.configureAxe()`

There are no changes required for `cy.configureAxe()`.

### `cy.checkA11y()`

This is where the majority of the changes will be required. All calls to `cy.checkA11y()` will need to be updated to `cy.checkAccessibility()` and the parameters will need to be updated to match the new API.

#### Basic usage

```diff
-cy.checkA11y();
+cy.checkAccessibility();
```

#### With options

```diff
-cy.checkA11y(null, {
-  includedImpacts: ['critical']
-});
+cy.checkAccessibility({
+  runOptions: {
+   includedImpacts: ['critical']
+  }
+});
```

#### With context

This `cypress-a11y-report` feature allows you to chain the command to a specific element using `cy.get()`.

```diff
-cy.checkA11y('.my-selector');
+cy.get('.my-selector').checkAccessibility();
```

#### With option to only log violations

```diff
-cy.checkA11y(null, null, null, true);
+cy.checkAccessibility({
+  shouldFail: () => false,
+});
```

#### With retries

```diff
-cy.checkA11y(null, {
-  retries: 3,
-  interval: 100
-});
+cy.checkAccessibility({
+  retry: {
+    limit: 3,
+    interval: 100
+  }
+});
```

#### With violationCallback

```diff
-cy.checkA11y(null, null, violations => {
-  console.log(violations);
-});
+cy.checkAccessibility({
+  reporters: [(results) => console.log(results.violations)],
+});
```
