const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const pdfService = require('../services/pdfService');
const keywordService = require('../services/keywordService');
const openaiService = require('../services/openaiService');
const mongoService = require('../services/mongoService');

/**
 * @swagger
 * /upload/:
 *   post:
 *     summary: Upload de documentos e configuração da persona
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *               persona:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Upload feito com sucesso
 */
router.post('/', upload.array('files'), async (req, res) => {
    const { clientId, persona } = req.body;
    const files = req.files;

    try {
        let knowledgeChunks = [];

        for (const file of files) {
            const chunks = await pdfService.parseAndChunkPdf(file.buffer);

            for (const chunk of chunks) {
                const keywords = keywordService.extractKeywords(chunk);
                const embedding = await pdfService.getEmbedding(chunk);

                knowledgeChunks.push({ text: chunk, keywords, embedding });
            }
        }

        await mongoService.saveClientKnowledge(clientId, persona, knowledgeChunks);

        res.status(200).json({ message: 'Upload and processing successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process documents' });
    }
});

module.exports = router;
