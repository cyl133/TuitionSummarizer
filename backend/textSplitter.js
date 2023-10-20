import axios from 'axios';
import { promises as fs } from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Function to estimate the number of tokens in a string
const estimateTokens = (text) => text.split(' ').length;

async function extractTextsAndContextFromFile(filePath) {
    // Read the JSON file
    const rawData = await fs.readFile(filePath, 'utf-8');
    
    // Parse the JSON content
    const data = JSON.parse(rawData);

    // Variables for chunk management
    const maxTokens = 16000; // Adjust based on your preferred buffer below the GPT-3 limit
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
                currentTokens = 0;
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

// Usage
const filePath = './lesson-texts/coxon1.json';
extractTextsAndContextFromFile(filePath).then(textsAndContexts => {
    fs.writeFile('./lesson-texts/coxon1_big-chunk.json', JSON.stringify(textsAndContexts, null, 2));
}).catch(error => {
    console.error('Error processing the data:', error);
});
