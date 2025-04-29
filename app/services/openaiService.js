const axios = require('axios');
const { OpenAI } = require('openai');
const openai = new OpenAI(api_key = process.env.OPENAI_API_KEY);

exports.askOpenAI = async (systemPrompt, question) => {

    const response = await openai.responses.create({
        model: process.env.OPENAI_RESPONSE_MODEL, // modelo de linguagem
        instructions: systemPrompt,
        input: question,
    })

    return response.output_text;
};

exports.getQuestionEmbedding = async (question) => {
    const response = await openai.embeddings.create({
        model: process.env.OPENAI_EMBEDDINGS_MODEL, // modelo de embeddings
        input: question,
    });

    const embedding = response.data[0].embedding;
    return embedding;
}