import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const assistantId = 'asst_ZgxJ4r5Mv4a0adF99CnVPZnW';

app.post('/api/generate', async (req, res) => {
  try {
    const userMessage = req.body.prompt;

    const thread = await openai.beta.threads.create();
    const run = await openai.beta.threads.createAndRun({
      assistant_id: assistantId,
      thread_id: thread.id,
      thread: {
        messages: [{ role: 'user', content: userMessage }],
      },
    });

    let completedRun;
    while (true) {
      completedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (completedRun.status === 'completed') break;
      if (completedRun.status === 'failed') throw new Error('Run failed');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const responseMessage = messages.data[0].content[0].text.value;

    res.send(responseMessage);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating TypoMaster response.");
  }
});

app.listen(port, () => {
  console.log(`TypoMaster server is running on port ${port}`);
});
