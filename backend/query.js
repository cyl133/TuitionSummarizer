import { config as dotenvConfig } from 'dotenv';
import { getEmbedding } from './embeddingGeneration.js'; // Ensure this is the correct path and method for your embedding function.
import { Pinecone } from '@pinecone-database/pinecone';

// Loading the environment variables
dotenvConfig();

export const query = async (query, topK) => {

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });

  // Target the index
  const indexName = 'tuition';
  const index = pinecone.index(indexName); // removed the generic type

  // Assuming you have an 'embedder' to initialize (based on your original code)
  // If not, you should remove the next line.
  // await embedder.init();

  // Embed the query
  const queryEmbedding = await getEmbedding(query);

   // Query the index using the query embedding
   const results = await index.query({
    vector: queryEmbedding, // Assuming queryEmbedding is an object with a 'values' property that is an array.
    topK,
    includeMetadata: true,
    includeValues: false,
  });

  // Process and format the results
const formattedResults = results.matches.map((match) => {
  // Parse the serialized context
  const contextList = JSON.parse(match.metadata.context);

  // Initialize an empty array to hold parts of the conversation
  let conversationParts = [];

  // Iterate through each part of the conversation, formatting it
  contextList.forEach((context) => {
    // Format the current part with the speaker's name and text
    let formattedPart = `Speaker ${context.speaker}: ${context.text}`;
    // Add the formatted part to the conversation array
    conversationParts.push(formattedPart);
  });

  // Join all parts into a single conversation string
  let fullConversation = conversationParts.join(' ');

  return {
    conversation: fullConversation,  // This is the concatenated, formatted conversation
    score: match.score,
  };
});

  // Print the formatted results
  return (formattedResults);
};

let searchText = "i want to know what the teacher said about topic sentences";
let topResults = 10;

// Call the query function
query(searchText, topResults)
  .then(() => {
    console.log('Query completed successfully.');
  })
  .catch((error) => {
    console.error('An error occurred:', error);
  });