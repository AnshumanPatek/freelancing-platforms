const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Job Portal API',
      version: '1.0.0',
      description: 'API documentation for Job Portal application with rate limiting protection',
      contact: {
        name: 'API Support',
        email: 'support@jobportal.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      parameters: {
        rateLimitInfo: {
          name: 'Rate-Limit-Info',
          in: 'header',
          description: 'Information about API rate limits',
          schema: {
            type: 'string'
          }
        }
      },
      responses: {
        TooManyRequests: {
          description: 'Too many requests, please try again later',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'integer',
                    example: 429
                  },
                  message: {
                    type: 'string',
                    example: 'Too many requests, please try again later.'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    externalDocs: {
      description: 'Rate Limiting Information',
      url: '#rate-limiting'
    }
  },
  apis: ['./routes/*.js'] // Path to the API docs
};

/**
 * @swagger
 * tags:
 *   name: Rate Limiting
 *   description: |
 *     The API implements rate limiting to prevent abuse and ensure fair usage:
 *     
 *     - Global Limit: 100 requests per 15 minutes per IP address
 *     - Authentication Endpoints: 10 requests per hour per IP address
 *     - Job Posting: 20 job posts per hour per IP address
 *     - Bidding: 30 bids per hour per IP address
 *     
 *     Rate limit information is returned in the response headers.
 */

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = { swaggerUi, swaggerSpec }; 