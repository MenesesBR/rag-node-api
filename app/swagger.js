const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Doc AI API',
      version: '1.0.0',
      description: 'API para upload de documentos e perguntas via RAG com IA',
    },
    servers: [
      {
        url: 'http://localhost:3000', // Quando for para Railway muda para o domínio de produção
      },
    ],
  },
  apis: ['./app/routes/*.js'], // Onde estão os comentários OpenAPI
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
