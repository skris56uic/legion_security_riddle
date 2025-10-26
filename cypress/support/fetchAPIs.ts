const https = require("https");

export const fetchPage = (page: number, limit = 100): Promise<any> => {
  return new Promise((resolve, reject) => {
    const url = `https://legion-riddle.onrender.com/api/pages?page=${page}&limit=${limit}`;

    https
      .get(url, (res: any) => {
        let data = "";

        res.on("data", (chunk: any) => {
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
      .on("error", (error: any) => {
        reject(error);
      });
  });
};

export const fetchAllPages = async (): Promise<any> => {
  try {
    const firstPage = await fetchPage(1);

    let allPages = [...firstPage.pages];
    const totalPages = firstPage.pagination.totalPages;

    // Fetch remaining pages
    const pagePromises = [];
    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(fetchPage(page));
    }

    if (pagePromises.length > 0) {
      const responses = await Promise.all(pagePromises);

      responses.forEach((response) => {
        allPages = allPages.concat(response.pages);
      });
    }

    const combinedData = {
      pages: allPages,
      pagination: firstPage.pagination,
    };

    return combinedData;
  } catch (error) {
    throw error;
  }
};
