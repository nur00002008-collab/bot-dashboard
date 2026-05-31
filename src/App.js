import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
 
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
 
const mockStats = {
  totalUsers: 1247,
  activeToday: 89,
  totalMessages: 15632,
  avgResponseTime: 1.2,
};
 
const mockMessageData = [
  { day: 'Дс', messages: 120 },
  { day: 'Сс', messages: 98 },
  { day: 'Ср', messages: 145 },
  { day: 'Бс', messages: 132 },
  { day: 'Жм', messages: 167 },
  { day: 'Сб', messages: 89 },
  { day: 'Жс', messages: 76 },
];
 
const mockUsers = [
  { id: 1, name: 'Алибек', username: '@alibek', messages: 45, lastSeen: '5 мин бұрын' },
  { id: 2, name: 'Айгерім', username: '@aigerin', messages: 32, lastSeen: '1 сағат бұрын' },
  { id: 3, name: 'Дамир', username: '@damir', messages: 28, lastSeen: '2 сағат бұрын' },
  { id: 4, name: 'Нұрлан', username: '@nurlan', messages: 19, lastSeen: 'Кеше' },
  { id: 5, name: 'Зарина', username: '@zarina', messages: 15, lastSeen: 'Кеше' },
];
 
const mockCommands = [
  { command: '/start', count: 234 },
  { command: '/help', count: 189 },
  { command: '/db', count: 156 },
  { command: '/benchmark', count: 98 },
  { command: '/funcall', count: 76 },
];
 
function StatCard({ title, value, subtitle, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{subtitle}</div>
    </div>
  );
}
 
function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Сәлем! Мен ботыңның көмекшісімін. Қандай сұрағың бар?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
 
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
 
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
 
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
 
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'Сен Telegram бот dashboard-ының көмекшісісің. Барлық жауапты қазақ тілінде бер. Нақты және қысқаша жауап бер.'
            },
            ...messages.map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: userMsg }
          ],
          max_tokens: 500,
        }),
      });
 
      const data = await response.json();
      const answer = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: '❌ Қате шықты, қайта көріңіз.' }]);
    }
 
    setLoading(false);
  };
 
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {/* Chat window */}
      {isOpen && (
        <div style={{
          width: '360px',
          height: '480px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '16px',
          overflow: 'hidden',
        }}>
          {/* Chat header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '16px',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>🤖 Бот көмекшісі</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Қазақша жауап береді</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >×</button>
          </div>
 
          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f0f5',
                  color: msg.role === 'user' ? 'white' : '#333',
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '16px 16px 16px 4px',
                  background: '#f0f0f5',
                  color: '#999',
                  fontSize: '14px',
                }}>
                  ⏳ Жазып жатыр...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
 
          {/* Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            gap: '8px',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Сұрақ жаз..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '20px',
                border: '1px solid #e0e0e0',
                outline: 'none',
                fontSize: '14px',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >➤</button>
          </div>
        </div>
      )}
 
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(102,126,234,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
 
function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
 
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
 
  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 40px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>🤖 Telegram Bot Dashboard</h1>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '14px' }}>@nurlanzzh_bot</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '6px 16px'
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#4ade80',
            }} />
            <span style={{ fontSize: '14px' }}>🟢 Онлайн</span>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
            {currentTime.toLocaleTimeString('kk-KZ')}
          </div>
        </div>
      </div>
 
      <div style={{ padding: '32px 40px' }}>
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <StatCard title="Барлық пайдаланушылар" value={mockStats.totalUsers.toLocaleString()} subtitle="+12 бүгін" color="#667eea" />
          <StatCard title="Бүгін белсенді" value={mockStats.activeToday} subtitle="Соңғы 24 сағат" color="#4ade80" />
          <StatCard title="Барлық хабарламалар" value={mockStats.totalMessages.toLocaleString()} subtitle="+234 бүгін" color="#f59e0b" />
          <StatCard title="Орт. жауап уақыты" value={`${mockStats.avgResponseTime}с`} subtitle="Groq API" color="#f43f5e" />
        </div>
 
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px', color: '#333' }}>📈 Хабарламалар (осы апта)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockMessageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="messages" stroke="#667eea" strokeWidth={2} dot={{ fill: '#667eea' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
 
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px', color: '#333' }}>🔧 Танымал командалар</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mockCommands} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="command" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#764ba2" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
 
        {/* Users Table */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 20px', color: '#333' }}>👥 Белсенді пайдаланушылар</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#666', fontWeight: '600' }}>Аты</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#666', fontWeight: '600' }}>Username</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#666', fontWeight: '600' }}>Хабарламалар</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#666', fontWeight: '600' }}>Соңғы белсенділік</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold', fontSize: '14px'
                      }}>
                        {user.name[0]}
                      </div>
                      {user.name}
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: '#667eea' }}>{user.username}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: '#f0f0ff', color: '#667eea',
                      padding: '4px 10px', borderRadius: '12px', fontSize: '13px'
                    }}>
                      {user.messages}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#999', fontSize: '14px' }}>{user.lastSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
 
      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
 
export default App;