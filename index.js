const puppeteer = require('puppeteer-core');  // Use puppeteer-core for Lambda compatibility
const chrome = require('chrome-aws-lambda');  // chrome-aws-lambda for Lambda compatibility

exports.handler = async (event, context) => {
  let browser;
  try {
    // Launch browser in AWS Lambda environment using chrome-aws-lambda
    browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    });

    // Create a new page and go to the website
    const page = await browser.newPage();
    await page.goto('https://alanchand.com/en/');

    // Wait for the elements to load
    await page.waitForSelector('.buy', { visible: true });

    // Scrape currency data
    const dataCurrency = await page.evaluate(() => {
      const rows = document.querySelectorAll('.tableRow');
      return Array.from(rows).map(row => {
        const title = row.querySelector('.title')?.innerText.trim();
        const buy = row.querySelector('.buy')?.innerText.trim();
        const sell = row.querySelector('.sell')?.innerText.trim();
        return { title, buy, sell };
      });
    });

    // Scrape crypto data
    const dataCrypto = await page.evaluate(() => {
      const rows = document.querySelectorAll('.crypto_sync');
      return Array.from(rows).map(row => {
        const crypto = row.querySelectorAll('.con');
        const secondX = crypto.length >= 2 ? crypto[1] : null;
        const title = secondX ? secondX.querySelector('.title')?.innerText.trim() : null;
        const price = secondX ? secondX.querySelector('.price')?.innerText.trim() : null;
        return { title, price };
      });
    });

    // Scrape gold data
    const dataGold = await page.evaluate(() => {
      const gl = document.querySelector('.gold');
      const rows = gl.querySelectorAll('.item');
      return Array.from(rows).map(row => {
        const body = row.querySelector('.body');
        const title = body ? body.querySelector('.title')?.innerText.trim() : null;
        const price = body ? body.querySelector('.price')?.innerText.trim() : null;
        return { title, price };
      });
    });

    // Return the data as a JSON response
    return {
      statusCode: 200,
      body: JSON.stringify({
        dataCurrency,
        dataCrypto,
        dataGold
      }),
    };
  } catch (error) {
    console.error("Error scraping data:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error scraping data", error: error.message }),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
