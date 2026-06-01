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
 
const mockCommands = [
  { command: '/start', count: 234 },
  { command: '/help', count: 189 },
  { command: '/db', count: 156 },
  { command: '/benchmark', count: 98 },
  { command: '/funcall', count: 76 },
];
 
const mockUsers = [
  { id: 1, name: 'Алибек', username: '@alibek', messages: 45, lastSeen: '5 мин бұрын' },
  { id: 2, name: 'Айгерім', username: '@aigerin', messages: 32, lastSeen: '1 сағат бұрын' },
  { id: 3, name: 'Дамир', username: '@damir', messages: 28, lastSeen: '2 сағат бұрын' },
  { id: 4, name: 'Нұрлан', username: '@nurlan', messages: 19, lastSeen: 'Кеше' },
  { id: 5, name: 'Зарина', username: '@zarina', messages: 15, lastSeen: 'Кеше' },
];
 
// ============ CHAT PAGE ============
function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Сәлем! Мен ботыңның AI көмекшісімін 🤖\n\nМен мыналарды жасай аламын:\n• 💬 Кез келген сұраққа жауап беремін\n• 🎨 Сурет жасаймын (/imagine немесе "сурет жаса: ...")\n• 🖼 Жіберген суретіңді талдаймын\n• 🎤 Дауыстық хабарлама транскрипциялаймын\n\nНе жасайық?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
 
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
 
  const generateImage = async (prompt) => {
    setGeneratingImage(true);
    setMessages(prev => [...prev, { role: 'assistant', text: `🎨 "${prompt}" суреті жасалуда...` }]);
    
    try {
      const seed = Date.now();
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${seed}&model=flux`;
      
      await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = resolve;
        img.onerror = resolve;
        img.src = imageUrl;
        setTimeout(resolve, 10000);
      });
      
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { 
          role: 'assistant', 
          text: `🎨 "${prompt}" — сурет дайын!`,
          image: imageUrl
        };
        return newMsgs;
      });
    } catch (err) {
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { 
          role: 'assistant', 
          text: `🎨 "${prompt}" — сурет дайын!`,
          image: imageUrl
        };
        return newMsgs;
      });
    }
    setGeneratingImage(false);
  };
 
  const analyzeImage = async (base64Image) => {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'system',
              content: 'Сен AI көмекшісісің. Суреттерді қазақ тілінде толық сипатта.'
            },
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
                { type: 'text', text: 'Бұл суретті қазақша толық сипатта.' }
              ]
            }
          ],
          max_tokens: 1000,
        }),
      });
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      return '❌ Суретті талдай алмадым.';
    }
  };
 
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
 
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result.split(',')[1];
      const imageUrl = event.target.result;
      
      setMessages(prev => [...prev, 
        { role: 'user', text: '🖼 Сурет жіберілді', image: imageUrl },
        { role: 'assistant', text: '🔍 Суретті талдап жатырмын...' }
      ]);
      
      setLoading(true);
      const analysis = await analyzeImage(base64);
      
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: 'assistant', text: analysis };
        return newMsgs;
      });
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };
 
  const sendMessage = async () => {
    if (!input.trim() || loading || generatingImage) return;
 
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
 
    const imagePatterns = [
      /^\/imagine\s+(.+)/i,
      /сурет жаса[:\s]+(.+)/i,
      /нарисуй[:\s]+(.+)/i,
      /draw[:\s]+(.+)/i,
      /generate image[:\s]+(.+)/i,
      /сурет салшы[:\s]+(.+)/i,
    ];
 
    for (const pattern of imagePatterns) {
      const match = userMsg.match(pattern);
      if (match) {
        await generateImage(match[1]);
        return;
      }
    }
 
    setLoading(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Сен Telegram бот көмекшісісің (@nurlanzzh_bot). 
              Барлық жауапты қазақ тілінде бер.
              Бот мыналарды жасай алады:
              - Кез келген сұраққа жауап береді
              - Аудио транскрипциялайды (Whisper)
              - Суреттерді талдайды
              - /imagine командасымен сурет жасайды
              - /search командасымен интернеттен іздейді
              - /private командасымен приватты режимге өтеді
              - /db командасымен базадан деректер алады
              Нақты, пайдалы жауап бер.`
            },
            ...messages.slice(-10).map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: userMsg }
          ],
          max_tokens: 1000,
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f6fa' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px 24px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px'
        }}>🤖</div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>@nurlanzzh_bot</div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', marginRight: '6px' }}></span>
            Онлайн · AI көмекшісі
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '13px', opacity: 0.7 }}>
          💬 Сурет жаса · 🖼 Сурет жібер · 🔍 Іздеу
        </div>
      </div>
 
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-end',
            gap: '8px',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0
              }}>🤖</div>
            )}
            <div style={{ maxWidth: '70%' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: msg.role === 'user' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white',
                color: msg.role === 'user' ? 'white' : '#333',
                fontSize: '15px',
                lineHeight: '1.6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.text}
              </div>
              {msg.image && (
                <img 
                  src={msg.image} 
                  alt="generated"
                  referrerPolicy="no-referrer"
                  style={{ 
                    maxWidth: '100%', 
                    borderRadius: '12px', 
                    marginTop: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                  }}
                  onError={(e) => {
                    e.target.src = `https://placehold.co/512x512/667eea/white?text=Сурет+жүктелуде`;
                  }}
                />
              )}
            </div>
          </div>
        ))}
        {(loading || generatingImage) && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
            }}>🤖</div>
            <div style={{
              padding: '12px 16px', borderRadius: '20px 20px 20px 4px',
              background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <span style={{ color: '#999' }}>
                {generatingImage ? '🎨 Сурет жасалуда...' : '⏳ Жазып жатыр...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
 
      <div style={{
        padding: '16px 20px',
        background: 'white',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-end',
      }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <button
          onClick={() => fileInputRef.current.click()}
          style={{
            background: '#f0f0f5', border: 'none', borderRadius: '50%',
            width: '44px', height: '44px', cursor: 'pointer', fontSize: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Сурет жібер"
        >🖼</button>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder='Сұрақ жаз... немесе "сурет жаса: қазақ даласы"'
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '24px',
              border: '1px solid #e0e0e0',
              outline: 'none',
              fontSize: '15px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={loading || generatingImage}
          style={{
            background: loading || generatingImage ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
            border: 'none', borderRadius: '50%',
            width: '44px', height: '44px',
            color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >➤</button>
      </div>
    </div>
  );
}
 
// ============ STATS PAGE ============
function StatCard({ title, value, subtitle, color, icon }) {
  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>{title}</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>{value}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: '32px' }}>{icon}</div>
      </div>
    </div>
  );
}
 
function StatsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', padding: '32px 40px' }}>
      <h2 style={{ margin: '0 0 24px', color: '#333', fontSize: '24px' }}>📊 Бот статистикасы</h2>
 
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <StatCard title="Барлық пайдаланушылар" value={mockStats.totalUsers.toLocaleString()} subtitle="+12 бүгін" color="#667eea" icon="👥" />
        <StatCard title="Бүгін белсенді" value={mockStats.activeToday} subtitle="Соңғы 24 сағат" color="#4ade80" icon="⚡" />
        <StatCard title="Барлық хабарламалар" value={mockStats.totalMessages.toLocaleString()} subtitle="+234 бүгін" color="#f59e0b" icon="💬" />
        <StatCard title="Орт. жауап уақыты" value={`${mockStats.avgResponseTime}с`} subtitle="Groq API" color="#f43f5e" icon="⏱" />
      </div>
 
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
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
 
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
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
 
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 20px', color: '#333' }}>👥 Белсенді пайдаланушылар</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
              <th style={{ textAlign: 'left', padding: '12px', color: '#666' }}>Аты</th>
              <th style={{ textAlign: 'left', padding: '12px', color: '#666' }}>Username</th>
              <th style={{ textAlign: 'left', padding: '12px', color: '#666' }}>Хабарламалар</th>
              <th style={{ textAlign: 'left', padding: '12px', color: '#666' }}>Соңғы белсенділік</th>
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
                      color: 'white', fontWeight: 'bold'
                    }}>{user.name[0]}</div>
                    {user.name}
                  </div>
                </td>
                <td style={{ padding: '12px', color: '#667eea' }}>{user.username}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ background: '#f0f0ff', color: '#667eea', padding: '4px 10px', borderRadius: '12px' }}>
                    {user.messages}
                  </span>
                </td>
                <td style={{ padding: '12px', color: '#999' }}>{user.lastSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
 
// ============ MAIN APP ============
function App() {
  const [page, setPage] = useState('chat');
  const [currentTime, setCurrentTime] = useState(new Date());
 
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setPage('chat')}
            style={{
              background: page === 'chat' ? 'rgba(255,255,255,0.25)' : 'transparent',
              border: 'none', color: 'white', padding: '8px 20px',
              borderRadius: '8px', cursor: 'pointer', fontSize: '15px',
              fontWeight: page === 'chat' ? 'bold' : 'normal',
            }}
          >💬 Чат</button>
          <button
            onClick={() => setPage('stats')}
            style={{
              background: page === 'stats' ? 'rgba(255,255,255,0.25)' : 'transparent',
              border: 'none', color: 'white', padding: '8px 20px',
              borderRadius: '8px', cursor: 'pointer', fontSize: '15px',
              fontWeight: page === 'stats' ? 'bold' : 'normal',
            }}
          >📊 Статистика</button>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
          🤖 @nurlanzzh_bot · {currentTime.toLocaleTimeString('kk-KZ')}
        </div>
      </div>
 
      <div style={{ flex: 1, overflow: 'auto' }}>
        {page === 'chat' ? <ChatPage /> : <StatsPage />}
      </div>
    </div>
  );
}
 
export default App;