const pdfParse = require('pdf-parse');
const axios = require('axios');

exports.parseAndChunkPdf = async (buffer) => {
  const data = await pdfParse(buffer);
  const text = data.text;

  // Divide o texto em chunks de 500 caracteres
  const chunks = text.match(/.{1,500}/g) || [];
  return chunks;
};

exports.getEmbedding = async (text) => {
  const response = await axios.post('https://api.openai.com/v1/embeddings', {
    input: text,
    model: 'text-embedding-ada-002'
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
  });

  return response.data.data[0].embedding;
};
