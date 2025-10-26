const https = require("https");

const fetchPage = (page, limit = 100) => {
  return new Promise((resolve, reject) => {
    const url = `https://legion-riddle.onrender.com/api/pages?page=${page}&limit=${limit}`;

    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const fetchAllPages = async () => {
  try {
    console.log("Fetching first page to get pagination info...");
    const firstPage = await fetchPage(1);

    let allPages = [...firstPage.pages];
    const totalPages = firstPage.pagination.totalPages;

    console.log(`Total pages to fetch: ${totalPages}`);

    // Fetch remaining pages
    const pagePromises = [];
    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(fetchPage(page));
    }

    if (pagePromises.length > 0) {
      console.log("Fetching remaining pages...");
      const responses = await Promise.all(pagePromises);

      responses.forEach((response, index) => {
        console.log(
          `Fetched page ${index + 2}, items: ${response.pages.length}`
        );
        allPages = allPages.concat(response.pages);
      });
    }

    const combinedData = {
      pages: allPages,
      pagination: firstPage.pagination,
    };

    console.log(`Total items collected: ${allPages.length}`);
    return combinedData;
  } catch (error) {
    console.error("Error fetching API data:", error);
    throw error;
  }
};

module.exports = { fetchPage, fetchAllPages };
