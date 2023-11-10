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

// Load the context file
let context = fs.readFileSync("./lesson-texts/coxon1_big-chunk.json", "utf8");
const jsonArray = JSON.parse(context);
context = jsonArray[0].text;

// Initialize the AI model
const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo-16k", 
  temperature: 0.7,
  openAIApiKey: OPENAI_API_KEY
});
// Define a breakdown prompt template for creating sub-questions
const breakdownPromptTemplate = PromptTemplate.fromTemplate(
  `
  /* Instruction Block */
  PROVIDE ME ONLY WITH THE QUESTIONS IN POINT FORM.
  You are tasked with dissecting a user's inquiry about a tuition session into specific sub-questions to gather a comprehensive understanding. These sub-questions should delve into the particulars of the user's main question, exploring aspects like student performance, areas of improvement, understanding of the lesson, and interaction during the session. Generate sub-questions that require detailed insights, ensuring they are clear, direct, and relevant to the original query. Avoid overgeneration; focus on creating sub-questions that contribute meaningfully to addressing the user's primary concern.

  [Application Context]
  Your role operates within an educational assistance platform, providing support to parents, students, and educators by analyzing tuition sessions. Users expect in-depth feedback, clarification on academic topics, and advice based on recorded or transcribed sessions. Your responses must be informative, empathetic, and tailored to the user's role and needs.

  [Sub-Questions Creation Guidance]
  While creating sub-questions, consider the user's background, the context of the tuition session, and the specific details that would be necessary to form a thorough response. The sub-questions should not be superficial or solicit basic 'yes' or 'no' answers but should encourage detailed and informative responses.

  [Scenario Handling]
  Be adaptive to various user scenarios, whether it's a parent inquiring about their child's progress, a student seeking understanding of academic concepts, or a teacher exploring teaching effectiveness. Your sub-questions should reflect these perspectives and the nuances each role entails.

  /* Separators */

  [Question]
  - QUESTION START -
  {question}
  - QUESTION END -
`);


// Define the main question prompt template (existing one)
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

// Chain for generating sub-questions without context
const breakdownChain = RunnableSequence.from([
  {
    question: input => input.question,
  },
  breakdownPromptTemplate,
  model,
  new StringOutputParser(),
]);

// Main chain for generating final responses with context
const responseChain = RunnableSequence.from([
  {
    question: input => input,
    chatHistory: input => input.chatHistory || "",
  },
  questionPrompt,
  model,
  new StringOutputParser(),
]);

// Endpoint for question-answering requests
app.post('/answer', async (req, res) => {
  try {
    const question = req.body.question;
    const chatHistory = req.body.chatHistory;

    // If there's no question, respond with an error
    if (!question) {
      return res.status(400).json({ error: 'No question provided' });
    }

    // Stage One: Break down the user's question into more detailed inquiries or points.
    const breakdownResponse = await breakdownChain.invoke({
      question: question,
    });

    // Check the AI's output and proceed. We assume here that the AI returns a string.
    if (breakdownResponse) {
      // Treat the AI's response as a string and prepare it for the next stage.
      const detailedQuestion = breakdownResponse; // This is a string.

      // Stage Two: Generate a detailed response considering the context and the new detailed question.
      const result = await responseChain.invoke({
        question: detailedQuestion, // Here, we pass the new detailed question.
        chatHistory: chatHistory, // Maintain the chat history, if available.
        context: context
      });

      // Check the AI's output and proceed.
      if (result) {
        // If there is a valid response, send it back to the user.
        return res.json({ result });
      } else {
        // Handle cases where the AI's response is not sufficient.
        return res.status(400).json({ error: 'AI generated an unclear response.' });
      }
    } else {
      // If the breakdown didn't result in a new question, handle this case based on your application's logic.
      return res.status(400).json({ error: 'AI could not generate detailed questions.' });
    }
  } catch (error) {
    // Handle any errors that occurred during the process.
    console.error('Error while generating answer:', error);
    return res.status(500).json({ error: 'Error while generating answer' });
  }
});

// Set the port for the server.
const PORT = process.env.PORT || 5000;

// Start the server.
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});