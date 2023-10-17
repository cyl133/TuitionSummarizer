import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
});

function chunk(array, size) {
    const chunked_arr = [];
    let index = 0;
    while (index < array.length) {
      chunked_arr.push(array.slice(index, size + index));
      index += size;
    }
    return chunked_arr;
}

async function upsertChunkedData(index, transformedData) {
    const BATCH_SIZE = 100;
  
    // Break data into chunks
    const dataChunks = chunk(transformedData, BATCH_SIZE);
  
    for (const batch of dataChunks) {
      try {
        // Upsert data in chunks
        await index.upsert(batch);
        console.log('Batch upserted successfully');
      } catch (err) {
        console.error('Failed to upsert batch:', err);
      }
    }
}

async function upsertDataFromFile(filePath, index) {
    // Step 1: Read the JSON file
    const data = await fs.promises.readFile(filePath, 'utf8');

    // Step 2: Parse its content
    const jsonArray = JSON.parse(data);

    // Step 3: Transform the content, serializing the context object to a JSON string
    const transformedData = jsonArray.map(item => ({
        id: String(item.id),
        values: item.embedding,
        metadata: {
            context: JSON.stringify(item.context) // Serializing context to a string
        }
    }));

    console.log(transformedData);
    // Step 4: Call the upsert function
    await upsertChunkedData(index, transformedData).catch(console.error);
    console.log('Data has been upserted!');
}


// Usage
let index = pinecone.Index("tuition");
const filePath = './lesson-embeddings/coxon1_output_embeddings.json';
upsertDataFromFile(filePath, index);
