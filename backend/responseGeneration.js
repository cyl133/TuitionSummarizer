import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { query } from "./query.js";
import { PromptTemplate } from "langchain/prompts";
import * as fs from "fs";

function getFormattedConversations(queryResults) {
    // Extracting conversations from the query results
        let conversations = queryResults.map((result) => {
            return result.conversation;
          });
        
          return conversations;3
  }


async function main() {
  try {
    // Initialize your OpenAI model (assuming this is similar to GPT-3 but within your custom framework)
    const model = new OpenAI({ temperature: 0, "model": "gpt-4" });

    let searchText = "i want to know what the teacher said about topic sentences";
    let topResults = 50;

    // Retrieve the formatted conversations from your database
    const result = await query(searchText, topResults);
    const conversations = getFormattedConversations(result);

    // Split the conversations into manageable chunks if they are too long
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });

    // Create documents from your conversations
    // This assumes each conversation is a separate document for the summarization model.
    const docs = await textSplitter.createDocuments(conversations);

    const param = generateParams();

    // Load the summarization chain (assuming this is a model or pipeline specifically for summarization)
    const chain = loadSummarizationChain(model, 
        {  
            verbose: true,
            questionPrompt: param.SUMMARY_PROMPT,
            refinePrompt: param.SUMMARY_REFINE_PROMPT,
            type: "refine" 
        });

    // Process the documents through the summarization chain
    const res = await chain.call({
      input_documents: docs,
    });

    // Output the summarized text
    console.log({ res });

  } catch (error) {
    console.error("An error occurred during the summarization process: ", error);
  }
}

// Execute the main function
//main();


function generateParams() {

    const summaryTemplate = `
    You are an expert in summarizing lesson content.
    Your goal is to create a summary of a private 1-on-1 tuition session.
    Below you find the transcript of a podcast:
    --------
    {text}
    --------
    `;

    const SUMMARY_PROMPT = PromptTemplate.fromTemplate(summaryTemplate);

    const summaryRefineTemplate = `
    You are an expert in summarizing YouTube videos.
    Your goal is to create a summary of a podcast.
    We have provided an existing summary up to a certain point: {existing_answer}

    Below you find the transcript of a podcast:
    --------
    {text}
    --------

    Given the new context, refine the summary.
    `;

    const SUMMARY_REFINE_PROMPT = PromptTemplate.fromTemplate(
    summaryRefineTemplate
    );

    return {
        SUMMARY_PROMPT: SUMMARY_PROMPT,
        SUMMARY_REFINE_PROMPT: SUMMARY_REFINE_PROMPT
    };
}

