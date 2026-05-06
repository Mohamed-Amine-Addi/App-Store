import { useEffect, useState } from 'react';
import { getHistory } from '../api';

export default function History() {
  const [history, setHistory] = useState([]);
  useEffect(() => { getHistory().then(setHistory); }, []);

  return (
    <div className="page">
      <div className="page-header"><h1>Usage History</h1><p className="page-subtitle">Last 20 app launches</p></div>
      {history.length === 0
        ? <div className="empty-state"><div className="empty-icon">📊</div><p>No usage yet.</p></div>
        : <div className="history-list">
            {history.map(h => (
              <div key={h.id} className="history-item">
                <span className="history-icon">{h.icon}</span>
                <div className="history-info">
                  <span className="history-title">{h.title}</span>
                  <span className="history-date">{new Date(h.ran_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}