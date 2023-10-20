import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { RunnableSequence } from "langchain/schema/runnable";
import { StringOutputParser } from "langchain/schema/output_parser";
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Create an instance of an Express server
const app = express();
app.use(bodyParser.json());

// Load in the file we want to use for question answering
let context = fs.readFileSync("./lesson-texts/coxon1_big-chunk.json", "utf8");
const jsonArray = JSON.parse(context);
context =  jsonArray[0].text;

// Initialize the model to use to answer the question
const model = new ChatOpenAI({modelName: "gpt-3.5-turbo-16k", 
temperature: 0.7,
openAIApiKey: OPENAI_API_KEY});

/**
 * Helper method to format chat history for the prompt.
 */
const formatChatHistory = (human, ai, previousChatHistory = '') => {
  const newInteraction = `Human: ${human}\nAI: ${ai}`;
  return previousChatHistory ? `${previousChatHistory}\n\n${newInteraction}` : newInteraction;
};

/**
 * Create a prompt template for generating an answer based on context and a question.
 */
const questionPrompt = PromptTemplate.fromTemplate(
  `
  /* Instruction Block */
  Respond thoroughly and personably to the [Question], referencing explicit details from the [Tuition Lesson Recording] involving a single tutor and student. Your analysis should offer specific insights from the lesson, enhancing the understanding of the inquirer. Avoid referring to the [Chat History] unless it contains crucial context missing from the lesson recording. Maintain a professional tone throughout the conversation.

  /* Separators */

  [Question]
  - QUESTION START -
  {question}
  - QUESTION END -

  [Tuition Lesson Recording]
  - LESSON START -
  {context}
  - LESSON END -

  [Chat History]
  - CHAT HISTORY START -
  {chatHistory}
  - CHAT HISTORY END -
`);



// ... [rest of your code remains unchanged]


// Set up the sequence for generating responses
const chain = RunnableSequence.from([
  {
    question: input => input.question,
    chatHistory: input => input.chatHistory || "",
    context: () => context,
  },
  questionPrompt,
  model,
  new StringOutputParser(),
]);

// Endpoint to handle question-answering requests
app.post('/answer', async (req, res) => {
  try {
    const question = req.body.question;
    const chatHistory = req.body.chatHistory;

    // If there's no question, respond with an error
    if (!question) {
      return res.status(400).json({ error: 'No question provided' });
    }

    // Generate the answer
    const result = await chain.invoke({
      question: question,
      chatHistory: chatHistory, // if you want to maintain a chat history
    });
    console.log(result);
    // Respond with the answer
    return res.json(result);
  } catch (error) {
    console.error('Error while generating answer:', error);
    return res.status(500).json({ error: 'Error while generating answer' });
  }
});

// Set the port for the server
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
