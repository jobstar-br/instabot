# 🤖 InstaBOT Platform

Plataforma de automação de Instagram DM para agências de marketing.  
Substitui o ManyChat com custo fixo mensal independente do número de clientes.

---

## 📦 O que está incluído

- ✅ Webhook Instagram (recebe DMs em tempo real)
- ✅ Fluxos por palavra-chave (resposta automática)
- ✅ IA com Claude (responde quando nenhum fluxo bate)
- ✅ Suporte multi-cliente (quantos clientes quiser)
- ✅ Painel de administração web
- ✅ Logs de mensagens
- ✅ Pronto para Railway (deploy em 5 min)

---

## 💰 Custo estimado

| Item | Custo |
|------|-------|
| Railway (servidor) | ~$5–10/mês |
| Claude API (IA) | ~$0.01 por 1.000 msgs |
| Meta API | Gratuito |
| **Total** | **~$10–20/mês fixo** |

vs ManyChat: **$20 × N clientes/mês**

---

## 🚀 Deploy no Railway (passo a passo)

### 1. Pré-requisitos
- Conta no [Railway.app](https://railway.app) (gratuito)
- Conta no [GitHub](https://github.com) (gratuito)
- Conta no [Meta for Developers](https://developers.facebook.com) (gratuito)
- Chave da [API Anthropic](https://console.anthropic.com) (opcional, para IA)

---

### 2. Subir o código no GitHub

```bash
# Na pasta do projeto:
git init
git add .
git commit -m "InstaBOT Platform v1"

# Crie um repositório no GitHub e suba:
git remote add origin https://github.com/SEU_USUARIO/instabot.git
git push -u origin main
```

---

### 3. Deploy no Railway

1. Acesse [railway.app](https://railway.app) → **New Project**
2. Selecione **Deploy from GitHub repo**
3. Escolha o repositório `instabot`
4. Railway detecta automaticamente Node.js e faz o deploy

---

### 4. Configurar variáveis de ambiente no Railway

No painel do Railway → seu projeto → **Variables**, adicione:

| Variável | Valor |
|----------|-------|
| `VERIFY_TOKEN` | Qualquer string secreta. Ex: `minha_agencia_2024` |
| `ANTHROPIC_API_KEY` | Sua chave da Anthropic (opcional) |
| `ADMIN_PASSWORD` | Senha do painel. Ex: `agencia@2024` |
| `PORT` | `3000` |
| `PUBLIC_URL` | URL gerada pelo Railway. Ex: `https://instabot-production.up.railway.app` |

> ⚠️ Após salvar as variáveis, o Railway reinicia automaticamente.

---

### 5. Copiar a URL pública

No Railway → seu projeto → **Settings** → **Domains**  
Copie a URL. Ex: `https://instabot-production.up.railway.app`

Atualize a variável `PUBLIC_URL` com essa URL.

---

### 6. Configurar o App no Meta for Developers

#### 6a. Criar o App
1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. **My Apps** → **Create App**
3. Tipo: **Business**
4. Nome: qualquer (ex: "Agência Bot")

#### 6b. Adicionar produto Instagram
1. No app criado → **Add Product** → **Messenger** (funciona para Instagram)
2. Ou busque **Instagram Graph API**

#### 6c. Configurar Webhook
1. No app → **Webhooks** (menu lateral)
2. **New Subscription** → **Instagram**
3. **Callback URL**: `https://SUA-URL.railway.app/webhook`
4. **Verify Token**: o mesmo que você colocou em `VERIFY_TOKEN`
5. Clique em **Verify and Save**
6. Inscreva no campo: `messages` ✅

#### 6d. Conectar a página do Instagram
1. No app → **Instagram** → **Basic Display** ou **Instagram API**
2. Conecte a conta Instagram Business do cliente
3. Anote o **Page ID** (ID da página)
4. Gere um **Access Token** (Page Access Token com permissões de mensagens)

> 📌 Repita o passo 6d para cada cliente da agência

---

### 7. Acessar o painel

Abra no navegador: `https://SUA-URL.railway.app`

Digite a `ADMIN_PASSWORD` que você configurou.

---

### 8. Cadastrar o primeiro cliente

1. Painel → **Clientes** → **+ Novo Cliente**
2. Preencha:
   - **Nome**: Nome do cliente da agência
   - **Instagram Page ID**: ID da página (passo 6d)
   - **Access Token**: Token gerado (passo 6d)
   - **Prompt da IA**: Instruções para o bot desse cliente
3. Salvar ✅

---

### 9. Criar fluxos de resposta

1. Painel → **Fluxos** → Selecione o cliente → **+ Novo Fluxo**
2. Exemplos:

| Fluxo | Gatilhos | Resposta |
|-------|----------|----------|
| Boas-vindas | `oi, olá, boa tarde, bom dia` | `Olá! 👋 Seja bem-vindo! Como posso ajudar?` |
| Preço | `preço, valor, quanto custa, tabela` | `Nossos preços estão no link: [link]` |
| Horário | `horário, funciona, aberto` | `Atendemos de seg-sex, 9h às 18h 🕘` |
| Humano | `falar com humano, atendente, pessoa` | `Claro! Aguarde um momento, vou te transferir 👤` |

---

## 🏗️ Estrutura do projeto

```
instabot/
├── src/
│   ├── server.js       # Servidor Express + Webhook
│   ├── routes.js       # API REST do painel
│   ├── handler.js      # Motor de fluxos + IA
│   ├── instagram.js    # Integração Meta API
│   ├── ai.js           # Integração Claude AI
│   └── database.js     # SQLite (clientes, fluxos, logs)
├── dashboard/
│   └── index.html      # Painel de administração
├── data/               # Gerado automaticamente (banco de dados)
├── .env.example        # Variáveis de ambiente
├── railway.toml        # Config de deploy Railway
└── package.json
```

---

## 🔒 Segurança

- O painel é protegido por senha (`ADMIN_PASSWORD`)
- Tokens dos clientes ficam criptografados no banco local
- Para produção avançada, considere adicionar HTTPS básico e rate limiting

---

## 🛠️ Rodar localmente (para testes)

```bash
# 1. Instalar dependências
npm install

# 2. Criar o arquivo .env
cp .env.example .env
# Edite o .env com suas variáveis

# 3. Rodar
npm run dev

# 4. Para testar o webhook localmente, use ngrok:
npx ngrok http 3000
# Copie a URL https gerada e use como Callback URL no Meta
```

---

## ❓ Dúvidas frequentes

**O Railway vai dormir meu servidor?**  
Não no plano pago ($5/mês). No plano gratuito pode dormir após inatividade — recomendo o plano Hobby.

**Preciso de um app Meta aprovado?**  
Para testes, não. Para produção com múltiplos clientes, pode precisar de revisão do app. Consulte a documentação do Meta.

**Quantos clientes posso ter?**  
Ilimitado. O servidor suporta quantos clientes forem cadastrados.

**A IA responde automaticamente?**  
Sim! Se nenhum fluxo corresponder à mensagem, e a IA estiver habilitada para o cliente, o Claude responde automaticamente usando o prompt personalizado.
