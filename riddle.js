const { fetchAllPages } = require("./fetchAPIs");
const https = require("https");
const fs = require("fs");
const path = require("path");

// Helper function to fetch HTML content from a URL
const fetchHtmlContent = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve(data);
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

// Function to decode realVal from JavaScript content
const decodeRealVal = (htmlContent) => {
  try {
    // Extract script content
    const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
    if (!scriptMatch) return null;

    const scriptContent = scriptMatch[1];

    // Find all array declarations with their positions
    const arrayPattern = /const\s+(\w+)\s*=\s*\[([^\]]*)\]/g;
    const variablePattern = /const\s+(\w+)\s*=\s*([^;]+);/g;
    
    let arrays = [];
    let variables = [];
    let match;
    
    // Find all arrays
    while ((match = arrayPattern.exec(scriptContent)) !== null) {
      const arrayName = match[1];
      const arrayContent = match[2];
      const arrayLength = arrayContent
        .split(",")
        .filter((item) => item.trim()).length;

      arrays.push({
        name: arrayName,
        length: arrayLength,
        position: match.index,
        fullMatch: match[0],
        content: arrayContent
      });
    }

    // Find all variables
    arrayPattern.lastIndex = 0; // Reset regex
    while ((match = variablePattern.exec(scriptContent)) !== null) {
      const varName = match[1];
      const varValue = match[2].trim();

      variables.push({
        name: varName,
        value: varValue,
        position: match.index,
        fullMatch: match[0]
      });
    }

    if (arrays.length === 0 || variables.length === 0) return null;

    // Find the longest array
    const longestArray = arrays.reduce((longest, current) =>
      current.length > longest.length ? current : longest
    );

    // Find the variable just before the longest array
    const variablesBeforeLongestArray = variables.filter(
      (v) => v.position < longestArray.position
    );
    const previousVariable = variablesBeforeLongestArray[variablesBeforeLongestArray.length - 1];

    if (!previousVariable) return null;

    // Parse the longest array content to get actual numbers
    const arrayNumbers = longestArray.content
      .split(",")
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n));

    // Get the index from the previous variable
    const arrayIndex = parseInt(previousVariable.value);
    
    // Validate the index
    if (isNaN(arrayIndex) || arrayIndex < 0 || arrayIndex >= arrayNumbers.length) {
      return null;
    }

    // Get the real value using the index
    const realVal = arrayNumbers[arrayIndex];

    // Find the position variable (left/right)
    const positionMatch = scriptContent.match(
      /const\s+(\w+)\s*=\s*['"](left|right)['"];/
    );

    return {
      realVal,
      position: positionMatch && positionMatch[2] ? positionMatch[2] : "unknown",
      arrayLength: longestArray.length,
      index: arrayIndex,
      longestArrayName: longestArray.name,
      previousVariableName: previousVariable.name
    };

  } catch (error) {
    console.error("Error decoding script:", error);
    return null;
  }
};

// Function to process a single page
const processPage = async (pageUrl, index, total) => {
  try {
    const htmlContent = await fetchHtmlContent(pageUrl);
    const decodedValue = decodeRealVal(htmlContent);

    if (decodedValue) {
      // This is a REAL page with a valid number
      console.log(
        `  ✓ REAL PAGE ${index + 1}/${total}: Number ${decodedValue.realVal} (${
          decodedValue.position
        }) [Index: ${decodedValue.index}] at page: ${pageUrl}`
      );
      return {
        url: pageUrl,
        number: decodedValue.realVal,
        position: decodedValue.position,
        arrayIndex: decodedValue.index, // Store the array index
        success: true,
        pageType: "REAL",
      };
    } else {
      // This is a FAKE/IMPOSTER page
      console.log(`  ✗ FAKE PAGE ${index + 1}/${total}: Imposter detected`);
      return {
        url: pageUrl,
        number: null,
        position: "unknown",
        arrayIndex: null,
        success: false,
        pageType: "FAKE",
        error: "Imposter page - no valid JavaScript pattern found",
      };
    }
  } catch (error) {
    // Network or other error - also consider as fake
    console.log(`  ✗ ERROR PAGE ${index + 1}/${total}: ${error.message}`);
    return {
      url: pageUrl,
      number: null,
      position: "unknown",
      arrayIndex: null,
      success: false,
      pageType: "ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Function to save results to file
const saveResults = (results, summary) => {
  const timestamp = new Date().toISOString();

  // Save as RESULTS.md in the current directory
  const filePath = path.join(__dirname, "RESULTS.md");

  const realPages = results.filter((r) => r.pageType === "REAL");
  const fakePages = results.filter((r) => r.pageType === "FAKE");
  const errorPages = results.filter((r) => r.pageType === "ERROR");

  const content = `# Legion Security Riddle - Results

**Timestamp:** ${timestamp}

## 🎯 Challenge Summary

| Metric | Value | Status |
|--------|-------|--------|
| Total Pages Analyzed | ${results.length} | 📊 |
| Real Pages Found | ${realPages.length} | ✅ |
| Fake/Imposter Pages | ${fakePages.length} | ❌ |
| Error Pages | ${errorPages.length} | ⚠️ |
| Success Rate | ${((realPages.length / results.length) * 100).toFixed(
    2
  )}% | 📈 |

## 🏆 Final Answer

**Grand Total Sum: ${summary.totalSum}**

SUCCESS! Found **${summary.numbers.length}** secret numbers from real pages.

## 📊 Statistics

- **Average number value:** ${
    summary.numbers.length > 0
      ? (summary.totalSum / summary.numbers.length).toFixed(2)
      : 0
  }
- **Smallest number:** ${
    summary.numbers.length > 0 ? Math.min(...summary.numbers) : 0
  }
- **Largest number:** ${
    summary.numbers.length > 0 ? Math.max(...summary.numbers) : 0
  }
- **Real page percentage:** ${(
    (realPages.length / results.length) *
    100
  ).toFixed(2)}%
- **Fake page percentage:** ${(
    (fakePages.length / results.length) *
    100
  ).toFixed(2)}%

## 🔢 Secret Numbers from Real Pages

\`\`\`
${summary.numbers.join(", ")}
\`\`\`

## 📋 Real Pages Breakdown

${realPages
  .map(
    (result, index) =>
      `${index + 1}. **Number:** \`${result.number}\` **(${
        result.position
      })** - [Link](${result.url})`
  )
  .join("\n")}

## 🎭 Fake/Imposter Pages

<details>
<summary>Click to expand fake pages list (${fakePages.length} pages)</summary>

${fakePages
  .map((result, index) => `${index + 1}. **FAKE** - [Link](${result.url})`)
  .join("\n")}

</details>

${
  errorPages.length > 0
    ? `
## ⚠️ Error Pages

<details>
<summary>Click to expand error pages list (${errorPages.length} pages)</summary>

${errorPages
  .map(
    (result, index) =>
      `${index + 1}. **ERROR** - [Link](${result.url}) - \`${result.error}\``
  )
  .join("\n")}

</details>
`
    : ""
}

## 🎯 Mission Status: COMPLETE ✅

- **Total Secret Numbers Found:** ${summary.numbers.length}
- **Real Pages Identified:** ${realPages.length}
- **Imposters Detected:** ${fakePages.length}

---

*Generated by Legion Security Riddle Solver*
`;

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`\nResults saved to: ${filePath}`);
  return filePath;
};

// Main function
const main = async () => {
  try {
    console.log("🚀 Starting Legion Security Riddle solver...\n");
    console.log("🎯 Mission: Find 500 real pages among the imposters!\n");

    // Fetch all pages from API
    console.log("📡 Fetching pages from API...");
    const apiData = await fetchAllPages();
    console.log(`✅ Fetched ${apiData.pages.length} total pages to analyze\n`);

    // Process all pages
    console.log("🔍 Processing all pages...\n");
    const results = [];

    for (let i = 0; i < apiData.pages.length; i++) {
      const result = await processPage(apiData.pages[i].url, i, apiData.pages.length);
      results.push(result);
    }

    // Calculate summary
    const realPages = results.filter((r) => r.success && r.pageType === "REAL");
    const fakePages = results.filter((r) => r.pageType === "FAKE");
    const errorPages = results.filter((r) => r.pageType === "ERROR");
    const numbers = realPages.map((r) => r.number);
    const totalSum = numbers.reduce((sum, num) => sum + num, 0);

    const summary = {
      successful: realPages.length,
      failed: fakePages.length + errorPages.length,
      numbers,
      totalSum,
    };

    // Print final results
    console.log("\n🎯 MISSION COMPLETE!");
    console.log("====================");
    console.log(`Total Pages Analyzed: ${results.length}`);
    console.log(`✅ Real Pages Found: ${realPages.length}`);
    console.log(`❌ Fake Pages (Imposters): ${fakePages.length}`);
    console.log(`⚠️  Error Pages: ${errorPages.length}`);
    console.log(`🔢 Secret Numbers Found: ${numbers.length}`);
    console.log(`🏆 GRAND TOTAL SUM: ${totalSum}`);
    console.log(
      `📊 Success Rate: ${((realPages.length / results.length) * 100).toFixed(
        2
      )}%`
    );

    // Save results to file
    const filePath = saveResults(results, summary);

    console.log("\n✨ All 500 secret numbers found and summed!");
    console.log(`📁 Full report saved to: ${filePath}`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, processPage, decodeRealVal };
