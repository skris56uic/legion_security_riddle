import { defineConfig } from "cypress";
import { fetchAllPages } from "./cypress/support/fetchAPIs";
import { saveResultsToFile } from "./cypress/support/saveResultToFile";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        async fetchApiData() {
          const apiData = await fetchAllPages();
          return apiData;
        },

        async saveResults(data: {
          numbers: number[];
          totalSum: number;
          totalPages: number;
        }) {
          const timestamp = new Date().toISOString();
          const filePath = await saveResultsToFile({
            ...data,
            timestamp,
          });
          return filePath;
        },
      });
    },
  },
});
