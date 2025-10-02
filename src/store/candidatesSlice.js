// src/store/candidatesSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const initialState = {
  sessions: {},
  currentSessionId: null,
  list: []
};

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    startSession(state, action) {
      const id = uuidv4();
      state.sessions[id] = {
        id,
        profile: action.payload || {}, // {name,email,phone}
        messages: [],
        questionFlow: [],
        questionIndex: 0,
        evaluations: [], // { question, answer, expected, score, correct }
        startedAt: Date.now(),
        paused: false
      };
      state.currentSessionId = id;
    },

    addMessage(state, action) {
      const { sessionId, from, text } = action.payload;
      const s = state.sessions[sessionId];
      if (!s) return;
      s.messages.push({ from, text, at: Date.now() });
    },

    setQuestionFlow(state, action) {
      const { sessionId, questions } = action.payload;
      const s = state.sessions[sessionId];
      if (!s) return;
      s.questionFlow = questions;
      s.questionIndex = 0;
    },

    advanceQuestion(state, action) {
      const { sessionId } = action.payload;
      const s = state.sessions[sessionId];
      if (!s) return;
      s.questionIndex = Math.min(s.questionIndex + 1, (s.questionFlow?.length || 0));
    },

    addScore(state, action) {
      const { sessionId, question, answer, expected, score, correct } = action.payload;
      const s = state.sessions[sessionId];
      if (!s) return;
      s.evaluations.push({ question, answer, expected, score, correct });
    },

    finalizeSession(state, action) {
      const { sessionId, summary } = action.payload;
      const s = state.sessions[sessionId];
      if (!s) return;
      // compute finalScore as average of evaluation scores (0..10)
      const finalScore = s.evaluations.length
        ? Math.round((s.evaluations.reduce((a, b) => a + (b.score || 0), 0) / s.evaluations.length) * 10) / 10
        : 0;

      state.list.push({
        id: sessionId,
        profile: s.profile,
        messages: s.messages,
        evaluations: s.evaluations,
        finalSummary: summary || 'Interview complete',
        finalScore,
        createdAt: s.startedAt
      });

      delete state.sessions[sessionId];
      state.currentSessionId = null;
    },

    updateProfile(state, action) {
      const { sessionId, profile } = action.payload;
      const s = state.sessions[sessionId];
      if (!s) return;
      s.profile = { ...s.profile, ...profile };
    },

    pauseSession(state, action) {
      const { sessionId } = action.payload;
      const s = state.sessions[sessionId];
      if (!s) return;
      s.paused = true;
    },

    resumeSession(state, action) {
      const { sessionId } = action.payload;
      const s = state.sessions[sessionId];
      if (!s) return;
      s.paused = false;
      state.currentSessionId = sessionId;
    },

    deleteCandidate(state, action) {
      const { id } = action.payload;
      state.list = state.list.filter(c => c.id !== id);
    }
  }
});

export const {
  startSession,
  addMessage,
  setQuestionFlow,
  advanceQuestion,
  addScore,
  finalizeSession,
  updateProfile,
  pauseSession,
  resumeSession,
  deleteCandidate
} = candidatesSlice.actions;

export default candidatesSlice.reducer;






