import axios from 'axios';
import { promises as fs } from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDINGS_ENDPOINT = 'https://api.openai.com/v1/embeddings';
const MODEL_ID = 'text-embedding-ada-002';

// Function to estimate the number of tokens in a string
const estimateTokens = (text) => text.split(' ').length;

async function extractTextsAndContextFromFile(filePath) {
    // Read the JSON file
    const rawData = await fs.readFile(filePath, 'utf-8');
    
    // Parse the JSON content
    const data = JSON.parse(rawData);

    // Variables for chunk management
    const maxTokens = 500; // Adjust based on your preferred buffer below the GPT-3 limit
    let currentChunk = "";
    let currentTokens = 0;
    let currentContext = [];

    const textsAndContexts = [];

    for (const segment of data.segments) {
        for (const entry of segment.transcript) {
            const newEntry = entry.text + ' ';
            const estimatedTokens = estimateTokens(newEntry);

            if (currentTokens + estimatedTokens > maxTokens) {
                textsAndContexts.push({
                    text: currentChunk.trim(),
                    context: currentContext,
                });

                currentChunk = newEntry;
                currentTokens = estimatedTokens;
                currentContext = [{
                    speaker: segment.speaker,
                    text: entry.text,
                    start: entry.start,
                    segmentStart: segment.start,
                    segmentStop: segment.stop,
                }];
            } else {
                currentChunk += newEntry;
                currentTokens += estimatedTokens;
                currentContext.push({
                    speaker: segment.speaker,
                    text: entry.text,
                    start: entry.start,
                    segmentStart: segment.start,
                    segmentStop: segment.stop,
                });
            }
        }
    }

    // Push the last chunk if it's not empty
    if (currentChunk.trim() !== "") {
        textsAndContexts.push({ 
            text: currentChunk.trim(),
            context: currentContext
        });
    }

    return textsAndContexts;
}

export async function getEmbedding(text) {
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
                context: item.context // store the entire context without modifications
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
    //console.log(embeddingsData);

    // Optionally save to a file
    fs.writeFile('./lesson-embeddings/coxon1_output_embeddings.json', JSON.stringify(embeddingsData, null, 2));

}).catch(error => {
    console.error('Error processing the data:', error);
});
