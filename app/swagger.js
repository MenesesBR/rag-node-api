const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Doc AI API',
            version: '1.0.0',
            description: 'API para upload de documentos e perguntas via RAG com IA',
        }
    },
    apis: ['./app/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
