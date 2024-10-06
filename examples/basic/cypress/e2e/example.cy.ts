import { createHtmlReport } from 'cypress-accessibility-html-reporter';

describe('example', () => {
  it('passes', () => {
    cy.visit('/');
    cy.injectAxe();
    cy.checkAccessibility({
      retry: {
        interval: 400,
        limit: 1,
      },
      reporters: [(results) => createHtmlReport({ results })],
    });
  });
});
