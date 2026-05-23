require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { handleMessage } = require('./handler');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'dashboard')));

// =============================================
// WEBHOOK INSTAGRAM - Verificação (GET)
// =============================================
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('[Webhook] Verificação bem-sucedida!');
    res.status(200).send(challenge);
  } else {
    console.warn('[Webhook] Verificação falhou. Token incorreto.');
    res.sendStatus(403);
  }
});

// =============================================
// WEBHOOK INSTAGRAM - Receber mensagens (POST)
// =============================================
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // Responde imediatamente ao Meta

  try {
    const body = req.body;
    if (body.object !== 'instagram') return;

    for (const entry of body.entry || []) {
      const pageId = entry.id;

      // Encontra o cliente pelo instagram_page_id
      const client = db.prepare('SELECT * FROM clients WHERE instagram_page_id = ? AND active = 1').get(pageId);
      if (!client) {
        console.warn(`[Webhook] Page ID ${pageId} não cadastrado`);
        continue;
      }

      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id;
        const messageText = event.message?.text;

        // Ignora mensagens do próprio bot e mensagens sem texto
        if (!senderId || senderId === pageId || !messageText || event.message?.is_echo) continue;

        // Processa de forma assíncrona
        handleMessage(client.id, senderId, messageText).catch(err =>
          console.error('[Handler] Erro:', err.message)
        );
      }
    }
  } catch (err) {
    console.error('[Webhook] Erro ao processar:', err.message);
  }
});

// =============================================
// API ROUTES
// =============================================
app.use('/api', apiRoutes);

// =============================================
// DASHBOARD - Serve o painel
// =============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dashboard', 'index.html'));
});

// =============================================
// START SERVER
// =============================================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║       INSTABOT PLATFORM v1.0         ║
╠══════════════════════════════════════╣
║  Servidor: http://localhost:${PORT}     ║
║  Webhook:  /webhook                  ║
║  Painel:   /                         ║
╚══════════════════════════════════════╝
  `);
});
