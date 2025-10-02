// src/constants/questions.js
const QUESTIONS = [
  {
    id: 1,
    level: 'easy',
    q: 'What is the difference between state and props in React?',
    expected: 'State is mutable and managed within the component, props are read-only and passed from the parent.'
  },
  {
    id: 2,
    level: 'easy',
    q: 'Explain the purpose of package.json in a Node/React project.',
    expected: 'It contains metadata about the project and manages dependencies, scripts, and configuration.'
  },
  {
    id: 3,
    level: 'medium',
    q: 'How would you optimize a React list rendering performance for thousands of items?',
    expected: 'Use virtualization (react-window/react-virtualized), memoization, and stable keys to avoid re-renders.'
  },
  {
    id: 4,
    level: 'medium',
    q: 'Describe the flow of a request from browser to database in a MERN app.',
    expected: 'Browser -> Express/Node -> controller -> model -> MongoDB via Mongoose -> response back to client.'
  },
  {
    id: 5,
    level: 'hard',
    q: 'How would you design a scalable real-time notification system for millions of users?',
    expected: 'Use pub/sub (Kafka/Redis), websocket clusters, load balancers and horizontal scaling with message partitioning.'
  },
  {
    id: 6,
    level: 'hard',
    q: 'Explain memory leaks in Node.js and how to diagnose them.',
    expected: 'Caused by uncleared timers, global references, or event listeners; diagnose with heap snapshots and profilers.'
  }
];

export default QUESTIONS;
