import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

// הגדרת נתיב נוכחי לתמיכה ב-ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// שימוש ב-cors ו-body parser
app.use(cors());
app.use(bodyParser.json());

// הגשת קבצים סטטיים מתיקיית public
app.use(express.static(path.join(__dirname, 'public')));

// הגדרת דף הבית
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const assistantId = 'asst_aNEUaNGKxWciuqaLdLnB7K73';

app.post('/api/generate', async (req, res) => {
  const userInput = req.body.prompt;

  try {
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userInput,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    let runStatus;
    do {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    } while (runStatus.status !== 'completed' && runStatus.status !== 'failed');

    if (runStatus.status === 'failed') {
      throw new Error('Assistant failed to generate response');
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data.find(msg => msg.role === 'assistant');

    res.send(lastMessage?.content[0]?.text?.value || 'No response.');
  } catch (err) {
    console.error('OpenAI Error:', err);
    res.status(500).send('Error generating TypoMaster response.');
  }
});

app.listen(port, () => {
  console.log(`TypoMaster server is running on port ${port}`);
});

