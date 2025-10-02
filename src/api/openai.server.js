const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const app = express();
app.use(bodyParser.json());


const OPENAI_KEY = process.env.OPENAI_API_KEY;


app.post('/generate-questions', async (req, res) => {
const prompt = `Generate 6 interview questions for a Full Stack React/Node role: 2 easy, 2 medium, 2 hard. Return JSON array with {level, q}.`;
const r = await fetch('https://api.openai.com/v1/chat/completions', {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: prompt }], max_tokens: 700 }),
});
const j = await r.json();
// Expect the assistant to return a JSON payload; if not, fall back
let text = j.choices?.[0]?.message?.content || '';
try {
const parsed = JSON.parse(text);
return res.json({ questions: parsed });
} catch (err) {
// Fallback: simple split lines to questions
const lines = text.split('\n').filter(Boolean).slice(0,6);
const questions = lines.map((l, i) => ({ level: i<2?'easy':i<4?'medium':'hard', q: l.replace(/^\d+\.?\s*/, '') }));
return res.json({ questions });
}
});


app.post('/judge', async (req, res) => {
const { question, answer } = req.body;
const prompt = `You are an expert interviewer. Given the question:\n${question}\nAnd the candidate's answer:\n${answer}\nProvide a score 0-10 and a one-sentence feedback. Return JSON: {"score": number, "feedback": string}`;
const r = await fetch('https://api.openai.com/v1/chat/completions', {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: prompt }], max_tokens: 200 }),
});
const j = await r.json();
const text = j.choices?.[0]?.message?.content || '';
try {
const parsed = JSON.parse(text);
res.json(parsed);
} catch (err) {
// simplest fallback
res.json({ score: 5, feedback: 'Could not parse, default 5.' });
}
});


const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API listening on ${port}`));