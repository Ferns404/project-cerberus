
const attackAttempts = {};
const blocklist = new Set();

const ATTACK_THRESHOLD = 3; 
const BAN_DURATION_MS = 5 * 60 * 1000; 

const blockAttacker = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  if (blocklist.has(ip)) {
    return res.status(403).json({
      error: 'Access Denied. Your IP has been temporarily blocked for security reasons.'
    });
  }
  next();
};

// --- MODIFIED ---
// Now accepts socketIoInstance
const trackAttack = (ip, socketIoInstance) => { 
  if (blocklist.has(ip)) {
    return;
  }

  const now = Date.now();
  let ipRecord = attackAttempts[ip] || { count: 0, firstAttackTime: now };

  if (now - ipRecord.firstAttackTime > BAN_DURATION_MS) {
    ipRecord = { count: 0, firstAttackTime: now };
  }

  ipRecord.count += 1;
  attackAttempts[ip] = ipRecord; 

  console.log(`[WAF_TRACKING]: IP ${ip} has ${ipRecord.count} attack(s).`);

  if (ipRecord.count >= ATTACK_THRESHOLD) {
    // BAN THEM!
    blocklist.add(ip);
    console.log(`[WAF_BANNED]: IP ${ip} has been BANNED for ${BAN_DURATION_MS / 1000} seconds.`);

    // --- NEW: Emit the IP_BAN event! ---
    const banLogData = {
      attack_type: 'IP_BAN', // This is a new, custom type
      payload: `IP ${ip} automatically banned after ${ipRecord.count} attacks.`,
      ip_address: ip,
      timestamp: new Date().toISOString()
    };
    if (socketIoInstance && socketIoInstance.io) {
        socketIoInstance.io.emit('new_attack', banLogData);
        console.log('[SOCKET.IO]: Emitting "new_attack" (IP_BAN) event');
    }
    // --- END NEW ---

    // Set a timer to automatically unban them
    setTimeout(() => {
      blocklist.delete(ip);
      delete attackAttempts[ip]; 
      console.log(`[WAF_UNBANNED]: IP ${ip} has been removed from the blocklist.`);
    }, BAN_DURATION_MS);
  }
};

module.exports = {
  blockAttacker,
  trackAttack
};