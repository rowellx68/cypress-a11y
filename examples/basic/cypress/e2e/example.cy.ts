describe('example', () => {
  it('passes', () => {
    cy.visit('/');
    cy.injectAxe();
    cy.checkAccessibility({
      retry: {
        interval: 500,
        limit: 2,
      },
      reporters: [(results) => console.table(results.passes)],
    });

    cy.get('a').checkAccessibility();
  });
});
