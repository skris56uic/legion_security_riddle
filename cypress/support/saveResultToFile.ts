import * as fs from "fs";
import * as path from "path";

export const saveResultsToFile = (data: {
  numbers: number[];
  totalSum: number;
  totalPages: number;
  timestamp: string;
}): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const resultsDir = path.join(__dirname, "results");

      // Create results directory if it doesn't exist
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      const fileName = `legion-riddle-results-${Date.now()}.txt`;
      const filePath = path.join(resultsDir, fileName);

      const content = `
Legion Security Riddle - Results Summary
=======================================
Timestamp: ${data.timestamp}
Total Pages Processed: ${data.totalPages}
Numbers Found: [${data.numbers.join(", ")}]
Total Count of Numbers: ${data.numbers.length}
Total Sum: ${data.totalSum}`;

      fs.writeFileSync(filePath, content, "utf8");
      console.log(`Results saved to: ${filePath}`);
      resolve(filePath);
    } catch (error) {
      console.error("Error saving results to file:", error);
      reject(error);
    }
  });
};
