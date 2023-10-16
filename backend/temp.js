import fs from 'fs';

// Step 1: Read the JSON file
fs.readFile('./lesson-embeddings/coxon1_output_embeddings.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    // Step 2: Parse the file content to a JavaScript object
    const jsonArray = JSON.parse(data);

    // Step 3: Modify the object (rename `context` to `metadata`)
    const updatedData = jsonArray.map(item => {
        const { context, ...rest } = item;
        return {
            ...rest,
            metadata: context
        };
    });

    // Step 4: Stringify the modified object
    const jsonStr = JSON.stringify(updatedData, null, 2);

    // Step 5: Write it back to the file (or to a new file if you prefer)
    fs.writeFile('./lesson-embeddings/coxon1_output_embeddings.json', jsonStr, 'utf8', (err) => {
        if (err) {
            console.error('Error writing to the file:', err);
            return;
        }
        console.log('File has been updated!');
    });
});
