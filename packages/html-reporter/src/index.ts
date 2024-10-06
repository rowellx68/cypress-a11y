import Handlebars from 'handlebars';
import slugify from '@sindresorhus/slugify';
import type * as axe from 'axe-core';

const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>cypress-accessibility report</title>
</head>
<body>
  <main>
    <section>
      <h1>
        Axe-core® Accessibility Results
      </h1>
    </section>
  </main>
</body>
</html>`;

export type HtmlReporterOutputOptions = {
  /**
   * The path to the directory where the report will be saved.
   * @default 'cypress/reports'
   */
  outputDir?: string;

  /**
   * The name of the report file.
   * @default 'cypress-accessibility-report.html'
   */
  reportFileName?: string;
};

export type HtmlReporterOptions = {
  results: axe.AxeResults;
  options?: HtmlReporterOutputOptions;
};

export const createHtmlReport = ({
  results,
  options,
}: HtmlReporterOptions): void => {
  const outputDir =
    options?.outputDir || 'cypress/reports/cypress-accessibility';
  const fileName = slugify(
    `${Cypress.spec.name} ${Cypress.currentTest.titlePath.join(' ')}`,
  );
  const reportFileName = options?.reportFileName || `${fileName}.html`;
  const outputDirPath = `${outputDir}/${reportFileName}`;

  const html = Handlebars.compile(template)({
    results,
  });

  cy.writeFile(outputDirPath, html);
};
