require("dotenv").config();
const { Telegraf } = require("telegraf");
const axios = require("axios");
const express = require("express");

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// ===== MEMORY =====
const memory = {};

// ===== SAVE MEMORY =====
function saveMemory(userId, msg) {
  if (!memory[userId]) memory[userId] = [];
  memory[userId].push(msg);

  if (memory[userId].length > 5) {
    memory[userId].shift();
  }
}

// ===== SMART REPLY SYSTEM =====
function shouldReply(ctx) {
  const msg = ctx.message.text;

  if (!msg) return false;

  // ignore commands
  if (msg.startsWith("/")) return false;

  // avoid too short / too long
  if (msg.length < 3 || msg.length > 200) return false;

  // random reply chance (30%)
  return Math.random() < 0.3;
}

// ===== AI FUNCTION =====
async function getAIReply(message, userId) {
  const history = memory[userId]?.join(" | ") || "none";

  const res = await axios.post(
    process.env.AI_API,
    {
      model: "openchat/openchat-3.5",
      messages: [
        {
          role: "system",
          content: `
You are a Sri Lankan meme bot.

User history: ${history}

Style:
- Sinhala + English mix (Singlish)
- Very funny, savage, Gen Z
- Short replies (max 8 words)

Rules:
- Always be funny
- Light roast allowed
- Use slang: bn, aiyo, mokada, hari hari
- Sound like real WhatsApp friend
- Never be boring
`
        },
        {
          role: "user",
          content: message
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.AI_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return res.data.choices[0].message.content;
}

// ===== MAIN BOT =====
bot.on("text", async (ctx) => {
  try {
    if (!shouldReply(ctx)) return;

    const msg = ctx.message.text;
    const userId = ctx.from.id;

    saveMemory(userId, msg);

    // small delay (human feel)
    await new Promise((r) =>
      setTimeout(r, 500 + Math.random() * 1000)
    );

    // chaos mode (10%)
    if (Math.random() < 0.1) {
      return ctx.reply("mokakda bn me chat eka 💀");
    }

    const reply = await getAIReply(msg, userId);

    // sometimes mention name
    if (Math.random() < 0.3) {
      return ctx.reply(`${ctx.from.first_name} ${reply}`);
    }

    ctx.reply(reply);
  } catch (err) {
    console.log("Error:", err.message);
  }
});

// ===== START BOT =====
bot.launch().then(() => {
  console.log("🔥 AI Meme Bot Running...");
});

// ===== HEROKU FIX (WEB SERVER) =====
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running 😏");
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});
