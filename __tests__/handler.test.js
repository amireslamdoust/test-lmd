// __tests__/handler.test.js

const { handler } = require('../index');  // Import your Lambda function
const puppeteer = require('puppeteer-core');  // Import puppeteer-core
const chrome = require('chrome-aws-lambda');  // Import chrome-aws-lambda

jest.mock('puppeteer-core');  // Mock puppeteer
jest.mock('chrome-aws-lambda');  // Mock chrome-aws-lambda

describe('Lambda Handler', () => {
  let mockPage;
  let mockBrowser;

  beforeEach(() => {
    // Create a mock browser and page
    mockPage = {
      goto: jest.fn(),
      waitForSelector: jest.fn(),
      evaluate: jest.fn(),
      close: jest.fn(),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    };

    // Mock the launch function of puppeteer
    puppeteer.launch.mockResolvedValue(mockBrowser);

    // Mock the executablePath from chrome-aws-lambda
    chrome.executablePath = '/path/to/chrome'; // You can mock the path to the executable
    chrome.args = ['--no-sandbox', '--disable-setuid-sandbox'];
    chrome.headless = true;
  });

  it('should return scraped data successfully', async () => {
    // Mock the data returned from page.evaluate
    mockPage.evaluate.mockResolvedValueOnce([
      { title: 'USD', buy: '1.0', sell: '1.1' },
      { title: 'EUR', buy: '0.9', sell: '1.0' }
    ]);

    mockPage.evaluate.mockResolvedValueOnce([
      { title: 'Bitcoin', price: '$45000' },
      { title: 'Ethereum', price: '$3500' }
    ]);

    mockPage.evaluate.mockResolvedValueOnce([
      { title: 'Gold', price: '$1800' }
    ]);

    const event = {};  // You can customize the event if needed
    const context = {};  // Customize the context if needed

    const response = await handler(event, context);

    // Check that the handler returns the correct response
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty('dataCurrency');
    expect(JSON.parse(response.body)).toHaveProperty('dataCrypto');
    expect(JSON.parse(response.body)).toHaveProperty('dataGold');

    // Ensure evaluate was called for all three data points
    expect(mockPage.evaluate).toHaveBeenCalledTimes(3);
  });

  it('should handle errors gracefully', async () => {
    puppeteer.launch.mockRejectedValueOnce(new Error('Launch Error'));

    const event = {};  // You can customize the event if needed
    const context = {};  // Customize the context if needed

    const response = await handler(event, context);

    // Check that an error response is returned
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe('Error scraping data');
  });

  afterEach(() => {
    jest.clearAllMocks();  // Clear all mocks after each test
  });
});
