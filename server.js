import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const assistantId = 'asst_ZgxJ4r5Mv4a0adF99CnVPZnW'; // שימי פה את ה-ID שלך

app.post('/api/generate', async (req, res) => {
  const userInput = req.body.prompt;

  try {
    // שלב 1: יצירת thread חדש
    const thread = await openai.beta.threads.create();

    // שלב 2: שליחת ההודעה לתוך thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userInput,
    });

    // שלב 3: הפעלת assistant עם ה-thread
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // שלב 4: המתנה לסיום ההרצה
    let runStatus;
    do {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    } while (runStatus.status !== 'completed' && runStatus.status !== 'failed');

    if (runStatus.status === 'failed') {
      throw new Error('Assistant failed to generate response');
    }

    // שלב 5: שליפת התגובה
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
