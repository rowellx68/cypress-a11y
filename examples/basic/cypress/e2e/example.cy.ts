describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://www.cypress.io');
    cy.injectAxe();
    cy.checkAccessibility();
  });
});
