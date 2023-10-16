import axios from 'axios';
import { promises as fs } from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDINGS_ENDPOINT = 'https://api.openai.com/v1/embeddings';
const MODEL_ID = 'text-embedding-ada-002';

async function extractTextsAndContextFromFile(filePath) {
    // Read the JSON file
    const rawData = await fs.readFile(filePath, 'utf-8');
    
    // Parse the JSON content
    const data = JSON.parse(rawData);

    // Extract the text and context
    const textsAndContexts = data.segments.flatMap(segment => 
        segment.transcript.map(entry => ({
            text: entry.text,
            context: {
                speaker: segment.speaker,
                segmentStart: segment.start,
                segmentStop: segment.stop,
                transcriptStart: entry.start
            }
        }))
    );

    return textsAndContexts;
}

async function getEmbedding(text) {
    const response = await axios.post(OPENAI_EMBEDDINGS_ENDPOINT, {
        input: text,
        model: MODEL_ID
    }, {
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.data[0].embedding;
}

const getRandomId = () => {
    return crypto.randomBytes(4).readUInt32BE(0, true);
  };

async function generateEmbeddings(textsAndContexts) {
    const embeddingsData = [];

    for (const item of textsAndContexts) {
        try {
            const embedding = await getEmbedding(item.text);
            embeddingsData.push({
                id: getRandomId(),
                embedding,
                context: {...item.context, text: item.text}
            });
        } catch (error) {
            console.error('Error generating embedding for text:', item.text, error);
        }
    }

    return embeddingsData;
}

// Usage
const filePath = './lesson-texts/coxon1.json';
extractTextsAndContextFromFile(filePath).then(textsAndContexts => {
    return generateEmbeddings(textsAndContexts);
}).then(embeddingsData => {
    console.log(embeddingsData);

    // Optionally save to a file
    fs.writeFile('./lesson-embeddings/coxon1_output_embeddings.json', JSON.stringify(embeddingsData, null, 2));

}).catch(error => {
    console.error('Error processing the data:', error);
});
