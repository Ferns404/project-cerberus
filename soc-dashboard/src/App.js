
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client'; 

const socket = io('http://localhost:3001', { transports: ['websocket'] });

const ATTACK_TYPES = {
  ALL: 'All',
  SQLI: 'SQL Injection',
  XSS: 'XSS',
  BAC: 'Broken Access Control',
  IDOR: 'IDOR'
  // We don't need to add IP_BAN here, it's a special event
};

function App() {
  const [attacks, setAttacks] = useState([]);
  const [activeFilter, setActiveFilter] = useState(ATTACK_TYPES.ALL);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('[SOC_DASHBOARD]: Connected to server socket!');
    });

    socket.on('new_attack', (attackLog) => {
      console.log('Attack detected!', attackLog);
      setAttacks((prevAttacks) => [attackLog, ...prevAttacks]);
    });

    return () => {
      socket.off('connect');
      socket.off('new_attack');
    };
  }, []);

  const filteredAttacks = attacks.filter(attack => {
    if (activeFilter === ATTACK_TYPES.ALL) {
      return true;
    }
    return attack.attack_type === activeFilter;
  });

  return (
    <div className="container">
      <h1>[LIVE] CERBERUS SOC Dashboard <span>{filteredAttacks.length} ALERTS</span></h1>
      
      <nav className="filter-nav">
        {/* All the buttons remain the same */}
        <button 
          onClick={() => setActiveFilter(ATTACK_TYPES.ALL)}
          className={`filter-btn ${activeFilter === ATTACK_TYPES.ALL ? 'active' : ''}`}
          data-type="ALL"
        >
          All ({attacks.length})
        </button>
        <button 
          onClick={() => setActiveFilter(ATTACK_TYPES.SQLI)}
          className={`filter-btn ${activeFilter === ATTACK_TYPES.SQLI ? 'active' : ''}`}
          data-type="SQLi"
        >
          SQLi ({attacks.filter(a => a.attack_type === ATTACK_TYPES.SQLI).length})
        </button>
        <button 
          onClick={() => setActiveFilter(ATTACK_TYPES.XSS)}
          className={`filter-btn ${activeFilter === ATTACK_TYPES.XSS ? 'active' : ''}`}
          data-type="XSS"
        >
          XSS ({attacks.filter(a => a.attack_type === ATTACK_TYPES.XSS).length})
        </button>
        <button 
          onClick={() => setActiveFilter(ATTACK_TYPES.BAC)}
          className={`filter-btn ${activeFilter === ATTACK_TYPES.BAC ? 'active' : ''}`}
          data-type="BAC"
        >
          BAC ({attacks.filter(a => a.attack_type === ATTACK_TYPES.BAC).length})
        </button>
        <button 
          onClick={() => setActiveFilter(ATTACK_TYPES.IDOR)}
          className={`filter-btn ${activeFilter === ATTACK_TYPES.IDOR ? 'active' : ''}`}
          data-type="IDOR"
        >
          IDOR ({attacks.filter(a => a.attack_type === ATTACK_TYPES.IDOR).length})
        </button>
      </nav>

      <ul className="log-list">
        {filteredAttacks.map((attack, index) => (
          <li 
            key={index}
            className="log-item"
            data-type={attack.attack_type} // This will now include "IP_BAN"
          >
            <strong style={{ color: ColorForAttack(attack.attack_type) }}>
              [{attack.attack_type}]
            </strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>
              {new Date(attack.timestamp).toLocaleTimeString()}
            </span>
            <div className="log-payload">
              <strong>Payload:</strong> {attack.payload}
            </div>
            <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)'}}>
              <strong>Source IP:</strong> {attack.ip_address}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- MODIFIED ---
// Helper function now knows about IP_BAN
function ColorForAttack(type) {
  switch(type) {
    case ATTACK_TYPES.SQLI: return 'var(--danger)';
    case ATTACK_TYPES.XSS: return 'var(--warning)';
    case ATTACK_TYPES.BAC: return 'var(--info)';
    case ATTACK_TYPES.IDOR: return 'var(--purple)';
    case 'IP_BAN': return 'var(--ban-red)'; // <-- NEW
    default: return 'var(--text-color)';
  }
}

export default App;