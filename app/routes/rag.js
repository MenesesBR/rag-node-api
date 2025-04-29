const express = require('express');
const mongoService = require('../services/mongoService');
const openaiService = require('../services/openaiService');
const NodeCache = require('node-cache');
const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

/**
 * @swagger
 * /rag/ask:
 *   post:
 *     summary: Fazer pergunta para o bot baseado nos documentos do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resposta da IA
 */
router.post('/ask', async (req, res) => {
    const { clientId, question } = req.body;
    console.log(`Recebendo pergunta: ${question} do cliente: ${clientId}`);

    const cacheKey = `${clientId}_${question}`;

    if (cache.has(cacheKey)) {
        return res.json({ answer: cache.get(cacheKey), cached: true });
    }

    try {
        const knowledgeBase = await mongoService.getClientKnowledge(clientId);

        if (!knowledgeBase || knowledgeBase.length === 0) {
            return res.status(504).json({ error: 'Nenhum conhecimento encontrado para este cliente.' });
        }

        const persona = await mongoService.getClientPersona(clientId)

        const questionEmbedding = await openaiService.getQuestionEmbedding(question);

        const embeddings = knowledgeBase.map(doc => doc.embedding);

        const similarities = embeddings.map(embedding =>
            cosineSimilarity(embedding, questionEmbedding)
        );

        if (similarities.length === 0) {
            return res.status(404).json({ error: 'Nenhum conhecimento encontrado para este cliente.' });
        }

        const topIndices = similarities
            .map((score, index) => ({ score, index }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(item => item.index);

        const candidateContexts = topIndices.map(idx => knowledgeBase[idx].text);

        let formattedContexts = '';

        candidateContexts.forEach((text, i) => {
            formattedContexts += `${i + 1}. [INÍCIO DO TRECHO ${i + 1}] ` +
                text.replace(/_/g, '')
                    .replace(/\\n/g, '\n')
                    .replace(/\/\//g, '')
                    .replace(/[ ]{2,}/g, ' ')
                    .trim() +
                ` [FINAL DO TRECHO ${i + 1}]\n`;
        });


        const systemRerankingPrompt = `Responda apenas com os números dos melhores trechos separados por vírgula.
Garanta que os números respondidos sejam válidos entre os trechos.
Cada trecho é numerado de 1 a N, onde N é o número total de trechos.
Cada trecho começa com "[INÍCIO DO TRECHO]" e termina com "[FINAL DO TRECHO]".
Exemplo de resposta: 1,4,7.`

        const rerankingPrompt = `Baseado na pergunta: "${question}", selecione os 3 trechos mais relevantes abaixo:
        
        ${candidateContexts
                .map((ctx, i) => `${i + 1}. [INÍCIO DO TRECHO ${i + 1}] ${ctx.replace('_', '')} [FINAL DO TRECHO ${i + 1}]`)
                .join('\n')}`

        const rerankedResponse = await openaiService.askOpenAI(systemRerankingPrompt, rerankingPrompt);

        const selected = rerankedResponse
            .split(',')
            .map(x => x.trim())
            .filter(x => /^\d+$/.test(x))
            .map(x => parseInt(x, 10) - 1);

        const context = selected
            .map(i => candidateContexts[i].replace(/_/g, '')
                .replace(/\\n/g, '\n')
                .replace(/\/\//g, '')
                .replace(/[ ]{2,}/g, ' ')
                .trim())
            .join('\n');

        const systemPrompt = `Você é um assistente com a seguinte persona: ${persona}
Baseie sua resposta apenas nas seguintes informações:

${context}

Caso não tenha certeza ou não tenha informações relevantes, diga que não sabe ou que não tem informações suficientes.
Responda de forma clara e objetiva.`

        const answer = await openaiService.askOpenAI(systemPrompt, question)

        cache.set(cacheKey, answer);

        console.log(`Resposta gerada para a pergunta: ${question} do cliente: ${answer}`);
        res.status(200).json({ answer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process question' });
    }
});

function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
}

module.exports = router;
