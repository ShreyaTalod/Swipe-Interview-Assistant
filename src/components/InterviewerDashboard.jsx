// src/components/InterviewerDashboard.jsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, List, Button, Input, Select } from 'antd';
import { deleteCandidate } from '../store/candidatesSlice';

const { Search } = Input;
const { Option } = Select;

export default function InterviewerDashboard() {
  const dispatch = useDispatch();
  const candidates = useSelector(s => s.candidates.list) || [];
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('score');

  let items = candidates.filter(c =>
    (c.profile?.name || '').toLowerCase().includes(query.toLowerCase()) ||
    (c.profile?.email || '').toLowerCase().includes(query.toLowerCase())
  );

  items = [...items].sort((a, b) => {
    if (sortKey === 'score') return (b.finalScore || 0) - (a.finalScore || 0);
    if (sortKey === 'name') return (a.profile?.name || '').localeCompare(b.profile?.name || '');
    if (sortKey === 'date') return (b.createdAt || 0) - (a.createdAt || 0);
    return 0;
  });

  return (
    <Card title="Interviewer Dashboard" style={{ margin: 16 }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
        <Search placeholder="Search by name/email" onSearch={(v) => setQuery(v)} enterButton style={{ width: 300 }} />
        <Select defaultValue="score" onChange={(v) => setSortKey(v)} style={{ width: 180 }}>
          <Option value="score">Sort by Score</Option>
          <Option value="name">Sort by Name</Option>
          <Option value="date">Sort by Date</Option>
        </Select>
      </div>

      <List
        dataSource={items}
        renderItem={(c) => (
          <List.Item onClick={() => setSelected(c)} style={{ cursor: 'pointer' }}>
            <List.Item.Meta
              title={c.profile?.name || 'Unknown Candidate'}
              description={`Score: ${c.finalScore ?? 'Not graded'} | Email: ${c.profile?.email || 'N/A'}`}
            />
            <Button danger onClick={() => dispatch(deleteCandidate({ id: c.id }))}>Delete</Button>
          </List.Item>
        )}
      />

      {selected && (
        <Card title={`Interview Summary: ${selected.profile?.name || 'Candidate'}`} style={{ marginTop: 16 }}>
          <p><b>Email:</b> {selected.profile?.email || 'N/A'}</p>
          <p><b>Phone:</b> {selected.profile?.phone || 'N/A'}</p>
          <p><b>Final Score:</b> {selected.finalScore}</p>

          <List
            dataSource={selected.evaluations || []}
            renderItem={(qa, idx) => (
              <List.Item key={idx}>
                <div style={{ width: '100%' }}>
                  <p><b>Q:</b> {qa.question}</p>
                  <p><b>Your Answer:</b> {qa.answer}</p>
                  <p>{qa.correct ? '✅ Correct' : `❌ Incorrect (Expected: ${qa.expected || 'N/A'})`}</p>
                  <p><small>Score: {typeof qa.score === 'number' ? qa.score : '0'}</small></p>
                  <hr />
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}
    </Card>
  );
}







