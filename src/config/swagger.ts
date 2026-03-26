import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Raver Ad Platform API',
      version: '1.0.0',
      description: 'API documentation for the Raver Ad Platform backend services.',
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Local development server',
      },
      {
        url: 'https://apiplatform.raver.ai',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token here to authenticate your requests.',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.ts', './src/app.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
