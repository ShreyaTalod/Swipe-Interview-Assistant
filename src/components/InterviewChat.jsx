// src/components/InterviewChat.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Input, Button, List, Typography, Progress, message } from 'antd';
import {
  addMessage,
  setQuestionFlow,
  advanceQuestion,
  addScore,
  finalizeSession,
  pauseSession,
  updateProfile
} from '../store/candidatesSlice';
import QUESTIONS from '../constants/questions';

const { Text } = Typography;

// timers per index: Q1, Q2 = 20; Q3, Q4 = 60; Q5, Q6 = 120
function getTimerForIndex(i) {
  if (i === 0 || i === 1) return 20;
  if (i === 2 || i === 3) return 60;
  return 120;
}

// utils: normalize / tokens / jaccard
function tokensFromText(t) {
  if (!t) return [];
  const stop = new Set(['the','and','that','this','with','from','which','what','how','would','use','using',
    'a','an','in','on','for','to','of','is','are','be','it','its','as','by','or','we','you','i']);
  return t
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(x => x.trim())
    .filter(x => x.length > 2 && !stop.has(x));
}

function jaccard(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

// combined eval: phrase-match boost + jaccard fallback
function evaluate(userAnswer, expected) {
  if (!expected) return { score: 0, correct: false, expected: null };

  const ua = (userAnswer || '').toLowerCase();
  const exp = (expected || '').toLowerCase();

  // direct substring check for important phrases (if user includes key phrase)
  const importantPhrases = exp.split(/[.,;:]/).map(s => s.trim()).filter(Boolean).sort((a,b) => b.length - a.length);
  for (const phrase of importantPhrases) {
    if (phrase.length > 10 && ua.includes(phrase)) {
      // strong match
      return { score: 9.0, correct: true, expected };
    }
  }

  // token similarity
  const at = tokensFromText(ua);
  const bt = tokensFromText(exp);
  const sim = jaccard(at, bt); // 0..1
  const score = Math.round(sim * 100) / 10; // 0..10 one decimal
  const correct = sim >= 0.35; // threshold (tunable)
  return { score, correct, expected };
}

export default function InterviewChat() {
  const dispatch = useDispatch();
  const sessions = useSelector(s => s.candidates.sessions);
  const currentSessionId = useSelector(s => s.candidates.currentSessionId);
  const session = currentSessionId ? sessions[currentSessionId] : null;

  const [input, setInput] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);

  // Ensure canonical question flow with expected present
  useEffect(() => {
    if (!session) return;

    const needsReplace =
      !session.questionFlow ||
      session.questionFlow.length === 0 ||
      session.questionFlow.some(q => !q || typeof q.expected === 'undefined');

    if (needsReplace) {
      // use canonical QUESTIONS (imported from constants)
      dispatch(setQuestionFlow({ sessionId: session.id, questions: QUESTIONS }));
      // prompt for missing profile fields (but don't start questions until profile complete)
      if (!session.profile?.name) dispatch(addMessage({ sessionId: session.id, from: 'bot', text: 'Please enter your full name:' }));
      else if (!session.profile?.email) dispatch(addMessage({ sessionId: session.id, from: 'bot', text: 'Please enter your email:' }));
      else if (!session.profile?.phone) dispatch(addMessage({ sessionId: session.id, from: 'bot', text: 'Please enter your phone number:' }));
    }
  }, [session, dispatch]);

  // question/ask loop — only start questions after profile is complete
  useEffect(() => {
    if (!session || !session.questionFlow) return;

    // wait until profile complete
    if (!session.profile?.name || !session.profile?.email || !session.profile?.phone) return;

    const idx = session.questionIndex;
    if (idx < session.questionFlow.length) {
      const q = session.questionFlow[idx];
      const alreadyAsked = session.messages.find(m => m.from === 'bot' && m.text === q.q);
      if (!alreadyAsked) {
        dispatch(addMessage({ sessionId: session.id, from: 'bot', text: q.q }));
        startTimer(getTimerForIndex(idx));
      }
    } else {
      // finalize
      dispatch(finalizeSession({
        sessionId: session.id,
        summary: 'Interview completed'
      }));
    }
  }, [session?.questionIndex, session?.profile?.name, session?.profile?.email, session?.profile?.phone, session?.questionFlow, dispatch]);

  function startTimer(seconds) {
    clearTimer();
    setSecondsLeft(seconds);
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearTimer();
          handleAutoSubmit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSecondsLeft(0);
  }

  function handleAutoSubmit() {
    if (!session) return;
    const idx = session.questionIndex;
    if (!session.questionFlow || idx >= session.questionFlow.length) return;
    const q = session.questionFlow[idx];
    // record no response but include expected
    dispatch(addMessage({ sessionId: session.id, from: 'candidate', text: '[No response]' }));
    dispatch(addScore({
      sessionId: session.id,
      question: q.q,
      answer: '[No response]',
      expected: q.expected,
      score: 0,
      correct: false
    }));
    dispatch(advanceQuestion({ sessionId: session.id }));
  }

  function handleSubmit() {
    if (!session) return;
    const text = input.trim();
    if (!text) return;

    // check last bot prompt: if it asked for profile, update profile
    const lastBot = session.messages.slice().reverse().find(m => m.from === 'bot');
    if (lastBot) {
      const t = lastBot.text.toLowerCase();
      if (t.includes('full name')) {
        dispatch(updateProfile({ sessionId: session.id, profile: { name: text } }));
        dispatch(addMessage({ sessionId: session.id, from: 'candidate', text }));
        setInput('');
        return;
      }
      if (t.includes('email')) {
        dispatch(updateProfile({ sessionId: session.id, profile: { email: text } }));
        dispatch(addMessage({ sessionId: session.id, from: 'candidate', text }));
        setInput('');
        return;
      }
      if (t.includes('phone')) {
        dispatch(updateProfile({ sessionId: session.id, profile: { phone: text } }));
        dispatch(addMessage({ sessionId: session.id, from: 'candidate', text }));
        setInput('');
        return;
      }
    }

    // normal answer flow
    const idx = session.questionIndex;
    if (!session.questionFlow || idx >= session.questionFlow.length) {
      setInput('');
      return;
    }
    const q = session.questionFlow[idx];
    const result = evaluate(text, q.expected || q.q);

    dispatch(addMessage({ sessionId: session.id, from: 'candidate', text }));
    dispatch(addScore({
      sessionId: session.id,
      question: q.q,
      answer: text,
      expected: q.expected,
      score: result.score,
      correct: result.correct
    }));
    dispatch(advanceQuestion({ sessionId: session.id }));
    setInput('');
    clearTimer();
  }

  if (!session) {
    return <Card style={{ margin: 16 }}>Start by uploading a resume (left tab).</Card>;
  }

  return (
    <div style={{ margin: 16 }}>
      <Card title={`Interview - ${session.profile?.name || 'Candidate'}`} extra={
        <>
          <Text>Email: {session.profile?.email || 'N/A'}</Text> | <Text>Phone: {session.profile?.phone || 'N/A'}</Text>
        </>
      }>
        <div style={{ minHeight: 260, marginBottom: 12 }}>
          <List
            dataSource={session.messages}
            renderItem={(m, i) => (
              <List.Item key={i} style={{ justifyContent: m.from === 'bot' ? 'flex-start' : 'flex-end' }}>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ fontSize: 12, color: '#888' }}>{m.from.toUpperCase()}</div>
                  <div style={{ padding: 10, background: m.from === 'bot' ? '#f5f5f5' : '#d9f7be', borderRadius: 6 }}>{m.text}</div>
                </div>
              </List.Item>
            )}
          />
        </div>

        {session.questionIndex < (session.questionFlow?.length || 0) && (
          <div style={{ marginTop: 12 }}>
            <Progress percent={Math.round(((session.questionIndex) / session.questionFlow.length) * 100)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Input.TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={3} placeholder="Type your answer..." />
              <div style={{ width: 160 }}>
                <Text>Time left</Text>
                <div style={{ fontSize: 24 }}>{secondsLeft}s</div>
                <Button type="primary" block onClick={handleSubmit}>Submit</Button>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <Button onClick={() => { dispatch(pauseSession({ sessionId: session.id })); clearTimer(); message.info('Session paused'); }}>Pause</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}