const axios = require('axios');

const IG_API = 'https://graph.facebook.com/v19.0';

/**
 * Envia mensagem de texto via Instagram DM
 */
async function sendMessage(recipientId, text, accessToken) {
  try {
    const res = await axios.post(
      `${IG_API}/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        params: { access_token: accessToken }
      }
    );
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error(`[Instagram] Erro ao enviar mensagem: ${msg}`);
    throw err;
  }
}

/**
 * Busca informações de um usuário do Instagram
 */
async function getUserInfo(userId, accessToken) {
  try {
    const res = await axios.get(`${IG_API}/${userId}`, {
      params: { fields: 'name,username', access_token: accessToken }
    });
    return res.data;
  } catch {
    return { name: 'Usuário', username: userId };
  }
}

module.exports = { sendMessage, getUserInfo };
