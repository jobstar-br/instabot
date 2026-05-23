const db = require('./database');
const { sendMessage } = require('./instagram');
const { generateAIResponse } = require('./ai');
const { v4: uuidv4 } = require('uuid');

/**
 * Processa mensagem recebida de um cliente específico
 */
async function handleMessage(clientId, senderId, messageText) {
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND active = 1').get(clientId);
  if (!client) return;

  const text = (messageText || '').trim();
  console.log(`[MSG] Cliente: ${client.name} | De: ${senderId} | Msg: "${text}"`);

  // Registra mensagem recebida
  db.prepare(`INSERT INTO messages_log (id, client_id, sender_id, direction, message) VALUES (?,?,?,?,?)`)
    .run(uuidv4(), clientId, senderId, 'in', text);

  // Atualiza conversa
  const existing = db.prepare('SELECT * FROM conversations WHERE client_id=? AND sender_id=?').get(clientId, senderId);
  if (existing) {
    db.prepare('UPDATE conversations SET last_message=?, last_seen=CURRENT_TIMESTAMP, message_count=message_count+1 WHERE id=?')
      .run(text, existing.id);
  } else {
    db.prepare('INSERT INTO conversations (id, client_id, sender_id, last_message, message_count) VALUES (?,?,?,?,1)')
      .run(uuidv4(), clientId, senderId, text);
  }

  // 1. Verifica fluxos por palavra-chave
  const flows = db.prepare('SELECT * FROM flows WHERE client_id = ? AND active = 1').all(clientId);
  const lowerText = text.toLowerCase();

  for (const flow of flows) {
    const keywords = flow.trigger_keyword.toLowerCase().split(',').map(k => k.trim());
    const matched = keywords.some(kw => lowerText.includes(kw));

    if (matched) {
      console.log(`[FLOW] Gatilho "${flow.trigger_keyword}" ativado para cliente ${client.name}`);

      // Registra saída
      db.prepare(`INSERT INTO messages_log (id, client_id, sender_id, direction, message, flow_triggered) VALUES (?,?,?,?,?,?)`)
        .run(uuidv4(), clientId, senderId, 'out', flow.response_message, flow.name);

      await sendMessage(senderId, flow.response_message, client.access_token);
      return;
    }
  }

  // 2. Fallback: IA (se habilitada)
  if (client.ai_enabled) {
    const aiResponse = await generateAIResponse(text, client.ai_prompt);
    if (aiResponse) {
      db.prepare(`INSERT INTO messages_log (id, client_id, sender_id, direction, message, flow_triggered) VALUES (?,?,?,?,?,?)`)
        .run(uuidv4(), clientId, senderId, 'out', aiResponse, 'AI');

      await sendMessage(senderId, aiResponse, client.access_token);
      return;
    }
  }

  console.log(`[MSG] Nenhuma resposta configurada para: "${text}"`);
}

module.exports = { handleMessage };
