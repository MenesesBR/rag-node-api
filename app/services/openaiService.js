const axios = require('axios');
const { OpenAI } = require('openai');
const openai = new OpenAI(api_key = process.env.OPENAI_API_KEY);

exports.askOpenAI = async (systemPrompt, question) => {

    const response = await openai.responses.create({
        model: "gpt-4.1-nano-2025-04-14",
        instructions: systemPrompt,
        input: question,
    })

    return response.output_text;
};

exports.getQuestionEmbedding = async (question) => {
    const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002', // modelo de embeddings
        input: question,
    });

    const embedding = response.data[0].embedding;
    return embedding;
}