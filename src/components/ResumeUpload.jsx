import React, { useState } from 'react';
import { Upload, message, Typography, Card } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { extractTextFromPDF, extractNameEmailPhone } from '../utils/parser';
import { useDispatch } from 'react-redux';
import {
  startSession,
  addMessage,
  setQuestionFlow,
} from '../store/candidatesSlice';
import { store } from '../store/store';

const { Dragger } = Upload;
const { Text } = Typography;

const localQuestions = [
  { level: 'easy', q: 'What is the difference between state and props in React?' },
  { level: 'easy', q: 'Explain the purpose of package.json in a Node/React project.' },
  { level: 'medium', q: 'How would you optimize a React list rendering performance for thousands of items?' },
  { level: 'medium', q: 'Describe the flow of a request from browser to database in a MERN app.' },
  { level: 'hard', q: 'How would you design a scalable real-time notification system for millions of users?' },
  { level: 'hard', q: 'Explain memory leaks in Node.js and how to diagnose them.' },
];

export default function ResumeUpload({ onReady }) {
  const dispatch = useDispatch();
  const [uploadedFile, setUploadedFile] = useState(null);

  async function handleFile(file) {
    if (file.type !== 'application/pdf') {
      message.error('Please upload a PDF resume.');
      return false;
    }

    setUploadedFile(file.name);
    message.loading({ content: 'Parsing resume...', key: 'parse' });

    try {
      // Try parsing resume
      const text = await extractTextFromPDF(file);
      const parsed = extractNameEmailPhone(text);

      // Start session
      dispatch(
        startSession({
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
        })
      );

      // Get the real sessionId from Redux
      const sessionId = store.getState().candidates.currentSessionId;

      // Load questions immediately
      dispatch(setQuestionFlow({ sessionId, questions: localQuestions }));

      message.success({ content: 'Resume parsed. Proceed to the interview.', key: 'parse' });

      // Ask for missing details
      if (!parsed.name) {
        dispatch(addMessage({ sessionId, from: 'bot', text: 'Please enter your full name:' }));
      }
      if (!parsed.email) {
        dispatch(addMessage({ sessionId, from: 'bot', text: 'Please provide your email address:' }));
      }
      if (!parsed.phone) {
        dispatch(addMessage({ sessionId, from: 'bot', text: 'Please provide your phone number:' }));
      }

      onReady?.();
    } catch (err) {
      console.error('Resume parsing failed:', err);

      // Fallback: still start a session
      dispatch(startSession({ name: '', email: '', phone: '' }));
      const sessionId = store.getState().candidates.currentSessionId;
      dispatch(setQuestionFlow({ sessionId, questions: localQuestions }));

      message.warning({
        content: 'Could not extract details from resume. Please fill them in manually.',
        key: 'parse',
      });

      // Ask candidate to fill in details
      dispatch(addMessage({ sessionId, from: 'bot', text: 'Please enter your full name:' }));
      dispatch(addMessage({ sessionId, from: 'bot', text: 'Please provide your email address:' }));
      dispatch(addMessage({ sessionId, from: 'bot', text: 'Please provide your phone number:' }));

      onReady?.();
    }

    return false;
  }

  return (
    <Card style={{ margin: 16 }}>
      <Dragger
        beforeUpload={handleFile}
        showUploadList={false}
        multiple={false}
        accept=".pdf"
      >
        {uploadedFile ? (
          <div>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Uploaded: <b>{uploadedFile}</b>
            </p>
            <p className="ant-upload-hint">Resume uploaded. Chatbot will guide you next.</p>
          </div>
        ) : (
          <div>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag a PDF resume to upload</p>
            <p className="ant-upload-hint">We’ll extract Name, Email, and Phone automatically.</p>
          </div>
        )}
      </Dragger>
      <Text type="secondary">
        If parsing fails, the chatbot will ask you to type your details manually.
      </Text>
    </Card>
  );
}










