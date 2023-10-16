import Replicate from "replicate";
import { promises as fs } from 'fs';
import path from 'path';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const inputFilePath = "./lesson-audios/coxon1/output000.mp3";
// Read the file into a buffer
const data = await fs.readFile(inputFilePath);
// Convert the buffer into a base64-encoded string
const base64 = data.toString("base64");
// Set MIME type for MP3 audio
const mimeType = "audio/mpeg";
// Create the data URI
const dataURI = `data:${mimeType};base64,${base64}`;

const output = await replicate.run(
  "meronym/speaker-transcription:9950ee297f0fdad8736adf74ada54f63cc5b5bdfd5b2187366910ed5baf1a7a1",
  {
    input: {
      audio: dataURI,
    }
  }
);

// Extract directory name and file name without extension
const inputDirName = path.basename(path.dirname(inputFilePath));
const inputFileName = path.basename(inputFilePath, path.extname(inputFilePath));

const outputFileName = `${inputDirName}_${inputFileName}.json`;

// Save the output as JSON
const jsonString = JSON.stringify(output, null, 2);
await fs.writeFile(path.join("./lessons-text", outputFileName), jsonString);

console.log(`Output saved as JSON to ./lesson-text/${outputFileName}`);
