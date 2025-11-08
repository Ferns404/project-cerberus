const db = require('./db');
const { trackAttack } = require('./ipBlocker'); 

const attackPatterns = {
    SQLi: /('|\s|%27)(or|OR|--|#|\s(union|UNION)\s(select|SELECT))/,
    XSS: /(<|%3C)script(\s|\/|%2F|>|%3E)|(on\w+=)/,
    BAC: /(\/admin)/,
    IDOR: /(\/api\/users\/\d+)/ 
};

const detectAttacks = (socketIoInstance) => { // 'socketIoInstance' is already here
  return (req, res, next) => {
    let attackDetected = null;

    if (attackPatterns.BAC.test(req.path)) {
        attackDetected = { type: 'Broken Access Control', payload: req.path };
    } 
    else if (attackPatterns.IDOR.test(req.path)) {
        attackDetected = { type: 'IDOR', payload: req.path };
    }

    const sourcesToScan = [
        JSON.stringify(req.query),
        JSON.stringify(req.body)
    ];
    
    for (const source of sourcesToScan) {
        if (attackDetected) break; 
        if (attackPatterns.SQLi.test(source)) {
            attackDetected = { type: 'SQL Injection', payload: source };
            break; 
        }
        if (attackPatterns.XSS.test(source)) {
            attackDetected = { type: 'XSS', payload: source };
            break;
        }
    }

    if (attackDetected) {
        console.log(`[ATTACK DETECTED]: ${attackDetected.type}`);
        
        const ip = req.ip || req.connection.remoteAddress;

        // --- MODIFIED ---
        // Pass the socket instance to the tracker
        trackAttack(ip, socketIoInstance);
        // ----------------
        
        const logData = {
          attack_type: attackDetected.type,
          payload: attackDetected.payload,
          ip_address: ip,
          timestamp: new Date().toISOString()
        };

        if (socketIoInstance && socketIoInstance.io) {
            socketIoInstance.io.emit('new_attack', logData);
            console.log('[SOCKET.IO]: Emitting "new_attack" event');
        }

        const logQuery = 'INSERT INTO attack_logs (attack_type, payload, ip_address) VALUES ($1, $2, $3)';
        db.query(logQuery, [logData.attack_type, logData.payload, logData.ip_address])
          .catch(err => console.error('Failed to log attack:', err));
    }

    next();
  }; 
};

module.exports = detectAttacks;