export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation Error',
  WEBSITE_UNAVAILABLE: 'Website is unavailable or unreachable',
  CRAWL_TIMEOUT: 'Crawl timed out',
  ROBOTS_RESTRICTION: 'Crawling restricted by robots.txt',
  EMPTY_WEBSITE: 'Website is empty or contains no valid pages',
  INVALID_URL: 'Invalid URL provided',
  CRAWL_FAILED: 'Failed to crawl the website',
};

export const SUCCESS_MESSAGES = {
  CRAWL_SUCCESS: 'URL crawled successfully',
};
