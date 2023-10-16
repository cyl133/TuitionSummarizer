require('dotenv').config();
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { OpenAIWhisperAudio } = require("langchain/document_loaders/fs/openai_whisper_audio");

async function convertToMP3(inputFilePath, outputFilePath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputFilePath)
            .toFormat('mp3')
            .on('end', () => {
                console.log('Conversion finished.');
                resolve(outputFilePath);
            })
            .on('error', (err) => {
                console.error('Error:', err);
                reject(err);
            })
            .save(outputFilePath);
    });
}

async function processChunksWithWhisper(chunkDirectory) {
    const chunkFiles = fs.readdirSync(chunkDirectory)
                          .filter(file => file.startsWith('output') && file.endsWith('.mp3'))
                          .slice(0, 2); // Taking just the first two files
    
    for (const chunkFile of chunkFiles) {
        const chunkPath = path.join(chunkDirectory, chunkFile);

        try {
            const docs = await convertToText(chunkPath);
            console.log(`Processed ${chunkFile}:`, docs);

            // Save the results in separate files
            const resultFilePath = path.join(chunkDirectory, `${path.basename(chunkFile, '.mp3')}_result.json`);
            fs.writeFileSync(resultFilePath, JSON.stringify(docs, null, 4));

        } catch (err) {
            console.error(`Error processing ${chunkFile}:`, err);
        }
    }
}

async function convertToText(audioFilePath) {
    const loader = new OpenAIWhisperAudio(audioFilePath);
    const docs = await loader.load();
    return docs;
}

async function splitAudioIntoChunks(inputFilePath) {
    return new Promise((resolve, reject) => {
        const segmentTime = 300; // 5 minutes in seconds
        const outputPattern = './lesson-audios/coxon1/output%03d.mp3';
        
        ffmpeg(inputFilePath)
            .outputOptions([
                `-f segment`,
                `-segment_time ${segmentTime}`,
                `-segment_format mp3`,
                `-c copy`
            ])
            .on('end', () => {
                console.log('File splitting finished.');
                resolve();
            })
            .on('error', (err) => {
                console.error('Error:', err);
                reject(err);
            })
            .save(outputPattern);
    });
}


async function main() {
    const inputVideoPath = './lesson-videos/coxon1.MP4';
    const outputAudioPath = './lesson-audios/coxon1/coxon1.mp3';

    try {
        // Convert video to audio
        //await convertToMP3(inputVideoPath, outputAudioPath);
        
        // Splitting audio into chunks
        //await splitAudioIntoChunks(outputAudioPath);

        // Process chunks with OpenAI Whisper
        await processChunksWithWhisper('./lesson-audios/coxon1/');

    } catch (err) {
        console.error("There was an error during conversion:", err);
    }
};

(async () => {
    await main();
})();