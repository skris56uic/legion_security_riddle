export interface APIResponseData {
  pages: Array<{
    id: string;
    url: string;
    real_page: boolean;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

describe("Legion Security Riddle", () => {
  let apiResponseData: APIResponseData;
  let numbers: number[] = [];
  let total_sum = 0;

  it("Find the number for all pages", () => {
    cy.task("fetchApiData")
      .then((data: APIResponseData) => {
        apiResponseData = data;
        return data;
      })
      .then((data: APIResponseData) => {
        return cy.wrap(data.pages).each((page: any, index: number) => {
          cy.log(
            `Processing page ${index + 1} of ${data.pages.length}: ${page.url}`
          );

          cy.intercept("**", (req) => {
            if (req.url.includes(page.url)) {
              // Allow this specific request
              req.continue();
            } else {
              // Block everything else
              req.reply({ statusCode: 204 });
            }
          });

          cy.visit(page.url, { failOnStatusCode: false });

          // Check if page loaded successfully by looking for expected elements
          cy.get("body").then(($body) => {
            if ($body.find(".btn0").length === 0) {
              cy.log(
                `Page ${
                  index + 1
                } doesn't contain expected elements, skipping: ${page.url}`
              );
              return; // Skip this iteration
            }

            // click on class named : btn0
            cy.get(".btn0").click();
            cy.get(".btn1").click();
            cy.get(".btn2").click();
            cy.get(".btn3").click();
            cy.get(".btn4").click();

            // look for this text: Row 2 - Click to expand and click on it
            cy.contains("Row 2 - Click to expand").click();

            // Check right side first, then left side if right doesn't exist
            cy.get("body").then(($body) => {
              if (
                $body.find('#number-placeholder-right span[class^="val"]')
                  .length > 0
              ) {
                // Right side has the number
                cy.get('#number-placeholder-right span[class^="val"]').then(
                  ($span) => {
                    const number = parseInt($span.text().trim());
                    cy.log(
                      `Found number in RIGHT column: ${number} on page ${
                        index + 1
                      }`
                    );
                    numbers.push(number);
                  }
                );
              } else if (
                $body.find('#number-placeholder-left span[class^="val"]')
                  .length > 0
              ) {
                // Left side has the number
                cy.get('#number-placeholder-left span[class^="val"]').then(
                  ($span) => {
                    const number = parseInt($span.text().trim());
                    cy.log(
                      `Found number in LEFT column: ${number} on page ${
                        index + 1
                      }`
                    );
                    numbers.push(number);
                  }
                );
              } else {
                // Neither side has a number
                cy.log(
                  `No number found on either side for page ${index + 1}: ${
                    page.url
                  }`
                );
              }
            });
          });
        });
      })
      .then(() => {
        // After processing all pages, calculate the sum
        total_sum = numbers.reduce((sum, num) => sum + num, 0);
        cy.log(`All numbers found: [${numbers.join(", ")}]`);
        cy.log(`Total sum: ${total_sum}`);
        cy.log(`Total pages processed: ${apiResponseData.pages.length}`);

        // Save results to file using Cypress task
        cy.task("saveResults", {
          numbers: numbers,
          totalSum: total_sum,
          totalPages: apiResponseData.pages.length,
        }).then((filePath) => {
          cy.log(`Results saved to file: ${filePath}`);
        });

        // allow all requests again
        cy.intercept("**", (req) => {
          req.continue();
        });
        cy.visit("https://legion-riddle.onrender.com/");
      });
  });
});
