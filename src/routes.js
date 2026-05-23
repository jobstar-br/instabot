const express = require('express');
const router = express.Router();
const db = require('./database');
const { v4: uuidv4 } = require('uuid');

// Middleware de autenticação simples
function auth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token === process.env.ADMIN_PASSWORD) return next();
  res.status(401).json({ error: 'Não autorizado' });
}

// ---- CLIENTES ----

router.get('/clients', auth, (req, res) => {
  const clients = db.prepare('SELECT id, name, instagram_page_id, ai_enabled, ai_prompt, active, created_at FROM clients ORDER BY created_at DESC').all();
  res.json(clients);
});

router.post('/clients', auth, (req, res) => {
  const { name, instagram_page_id, access_token, ai_enabled, ai_prompt } = req.body;
  if (!name || !instagram_page_id || !access_token)
    return res.status(400).json({ error: 'name, instagram_page_id e access_token são obrigatórios' });

  const id = uuidv4();
  db.prepare('INSERT INTO clients (id, name, instagram_page_id, access_token, ai_enabled, ai_prompt) VALUES (?,?,?,?,?,?)')
    .run(id, name, instagram_page_id, access_token, ai_enabled ? 1 : 0, ai_prompt || 'Você é um assistente simpático. Responda de forma curta e útil.');

  res.json({ id, name, message: 'Cliente criado com sucesso!' });
});

router.put('/clients/:id', auth, (req, res) => {
  const { name, instagram_page_id, access_token, ai_enabled, ai_prompt, active } = req.body;
  db.prepare('UPDATE clients SET name=?, instagram_page_id=?, access_token=COALESCE(NULLIF(?,\'\'), access_token), ai_enabled=?, ai_prompt=?, active=? WHERE id=?')
    .run(name, instagram_page_id, access_token || '', ai_enabled ? 1 : 0, ai_prompt, active ? 1 : 0, req.params.id);
  res.json({ message: 'Cliente atualizado!' });
});

router.delete('/clients/:id', auth, (req, res) => {
  db.prepare('DELETE FROM clients WHERE id=?').run(req.params.id);
  res.json({ message: 'Cliente removido!' });
});

// ---- FLUXOS ----

router.get('/clients/:clientId/flows', auth, (req, res) => {
  const flows = db.prepare('SELECT * FROM flows WHERE client_id=? ORDER BY created_at DESC').all(req.params.clientId);
  res.json(flows);
});

router.post('/clients/:clientId/flows', auth, (req, res) => {
  const { name, trigger_keyword, response_message } = req.body;
  if (!name || !trigger_keyword || !response_message)
    return res.status(400).json({ error: 'name, trigger_keyword e response_message são obrigatórios' });

  const id = uuidv4();
  db.prepare('INSERT INTO flows (id, client_id, name, trigger_keyword, response_message) VALUES (?,?,?,?,?)')
    .run(id, req.params.clientId, name, trigger_keyword, response_message);

  res.json({ id, message: 'Fluxo criado!' });
});

router.put('/flows/:id', auth, (req, res) => {
  const { name, trigger_keyword, response_message, active } = req.body;
  db.prepare('UPDATE flows SET name=?, trigger_keyword=?, response_message=?, active=? WHERE id=?')
    .run(name, trigger_keyword, response_message, active ? 1 : 0, req.params.id);
  res.json({ message: 'Fluxo atualizado!' });
});

router.delete('/flows/:id', auth, (req, res) => {
  db.prepare('DELETE FROM flows WHERE id=?').run(req.params.id);
  res.json({ message: 'Fluxo removido!' });
});

// ---- DASHBOARD / STATS ----

router.get('/stats', auth, (req, res) => {
  const totalClients = db.prepare('SELECT COUNT(*) as c FROM clients WHERE active=1').get().c;
  const totalMessages = db.prepare('SELECT COUNT(*) as c FROM messages_log WHERE direction="in"').get().c;
  const totalFlows = db.prepare('SELECT COUNT(*) as c FROM flows WHERE active=1').get().c;
  const todayMessages = db.prepare("SELECT COUNT(*) as c FROM messages_log WHERE direction='in' AND date(created_at)=date('now')").get().c;

  res.json({ totalClients, totalMessages, totalFlows, todayMessages });
});

router.get('/clients/:clientId/logs', auth, (req, res) => {
  const logs = db.prepare('SELECT * FROM messages_log WHERE client_id=? ORDER BY created_at DESC LIMIT 100').all(req.params.clientId);
  res.json(logs);
});

router.get('/clients/:clientId/conversations', auth, (req, res) => {
  const convs = db.prepare('SELECT * FROM conversations WHERE client_id=? ORDER BY last_seen DESC LIMIT 50').all(req.params.clientId);
  res.json(convs);
});

// ---- WEBHOOK INFO ----
router.get('/webhook-url', auth, (req, res) => {
  const base = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
  res.json({
    webhook_url: `${base}/webhook`,
    verify_token: process.env.VERIFY_TOKEN || 'configure no .env'
  });
});

module.exports = router;
