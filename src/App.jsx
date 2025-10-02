import { Tabs } from "antd";
import ResumeUpload from "./components/ResumeUpload";
import InterviewChat from "./components/InterviewChat";
import InterviewerDashboard from "./components/InterviewerDashboard";

const tabStyle = {
  background: "#1890ff", // Blue background
  color: "white",
  padding: "10px 24px",
  borderRadius: "12px",
  fontWeight: "bold",
  fontSize: "18px",
  cursor: "pointer",
  transition: "background 0.3s ease",
};

const items = [
  {
    key: "1",
    label: (
      <div
        style={tabStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#096dd9")} // darker blue
        onMouseLeave={(e) => (e.currentTarget.style.background = "#1890ff")}
      >
        👤 Interviewee (chat)
      </div>
    ),
    children: (
      <div>
        <ResumeUpload />
        <InterviewChat />
      </div>
    ),
  },
  {
    key: "2",
    label: (
      <div
        style={tabStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#096dd9")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#1890ff")}
      >
        📊 Interviewer (dashboard)
      </div>
    ),
    children: <InterviewerDashboard />,
  },
];

function App() {
  return (
    <div style={{ margin: 16 }}>
      <Tabs
        defaultActiveKey="1"
        items={items}
        centered
        tabBarStyle={{
          padding: "12px",
          gap: "24px",
        }}
      />
    </div>
  );
}

export default App;


