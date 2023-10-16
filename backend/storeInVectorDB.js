import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
});


async function upsertDataFromFile(filePath, index) {
    // Step 1: Read the JSON file
    const data = await fs.promises.readFile(filePath, 'utf8');

    // Step 2: Parse its content
    const jsonArray = JSON.parse(data);

    // Step 3: Transform the content
    const transformedData = jsonArray.map(item => ({
        id: String(item.id),
        values: item.embedding // Assuming the embeddings are stored under "metadata" key
    }));

    console.log(transformedData);
    // Step 4: Call the upsert function
    await index.upsert(transformedData);
    console.log('Data has been upserted!');
}

// Usage
let index = pinecone.Index("tuition");
const filePath = './lesson-embeddings/coxon1_output_embeddings.json';
upsertDataFromFile(filePath, index);
