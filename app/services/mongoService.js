const { MongoClient } = require('mongodb');

let db;
let knowledgeCollection;
let clientDataCollection;

// Função para conectar ao MongoDB
async function connectToMongoDB() {
    if (db) return; // Já conectado

    try {
        const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
        await client.connect();
        db = client.db('rag_ai');
        knowledgeCollection = db.collection('knowledge');
        clientDataCollection = db.collection('client_data');
        console.log('Conectado ao MongoDB');
    } catch (err) {
        console.error('Erro ao conectar ao MongoDB:', err);
    }
}

// Conecta automaticamente ao carregar o módulo
connectToMongoDB();

exports.saveClientKnowledge = async (clientId, persona, knowledgeChunks) => {
    try {
        if (!knowledgeCollection) {
            throw new Error('Coleção não inicializada.');
        }
        const filter = { clientId };
        const update = { $set: { persona, knowledge: knowledgeChunks } };
        const options = { upsert: true };

        await knowledgeCollection.updateOne(filter, update, options);
    } catch (err) {
        console.error('Erro ao salvar dados no MongoDB:', err);
    }
};

exports.getClientKnowledge = async (clientId) => {
    try {
        if (!knowledgeCollection) {
            throw new Error('Coleção não inicializada.');
        }
        const cursor = await knowledgeCollection.find({ client_id: clientId }).toArray();
        return cursor;
    } catch (err) {
        console.error('Erro ao buscar dados no MongoDB:', err);
    }
};

exports.getClientPersona = async (clientId) => {
    try {
        if (!clientDataCollection) {
            throw new Error('Coleção não inicializada.');
        }
        const cursor = await clientDataCollection.findOne({ client_id: clientId });
        
        return cursor.persona;
    } catch (err) {
        console.error('Erro ao buscar dados no MongoDB:', err);
    }
};