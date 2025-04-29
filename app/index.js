require('dotenv').config();
const express = require('express');
const uploadRoutes = require('./routes/upload');
const ragRoutes = require('./routes/rag');
const setupSwagger = require('./swagger');

const app = express();
app.use(express.json());

app.use('/upload', uploadRoutes);
app.use('/rag', ragRoutes);

// Swagger
setupSwagger(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
