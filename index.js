require("dotenv").config();
const { Telegraf } = require("telegraf");
const axios = require("axios");
const express = require("express");

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

const vipUsers = new Set();
const memory = {};
const scores = {};

const OWNER_ID = Number(process.env.OWNER_ID);

function isOwner(ctx) {
  return ctx.from.id === OWNER_ID;
}

function shouldReply(ctx) {
  const msg = ctx.message;
  if (!msg.text) return false;

  if (msg.text.includes(`@${ctx.botInfo.username}`)) return true;

  if (
    msg.reply_to_message &&
    msg.reply_to_message.from.username === ctx.botInfo.username
  ) return true;

  return false;
}

function addScore(id) {
  if (!scores[id]) scores[id] = 0;
  scores[id]++;
}

function saveMemory(id, msg) {
  if (!memory[id]) memory[id] = [];
  memory[id].push(msg);
  if (memory[id].length > 5) memory[id].shift();
}

async function getAIReply(message, userId) {
  const history = memory[userId]?.join(" | ") || "none";

  try {
    const res = await axios.post(
      process.env.AI_API,
      {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          {
            role: "system",
            content: `
You are a Sri Lankan meme bot.

User history: ${history}

Style:
- Sinhala + English mix
- Very funny, short replies
- Gen Z slang
- Sometimes roast
`
          },
          { role: "user", content: message }
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
  } catch {
    return "aiyo brain lag una 😂";
  }
}

bot.start((ctx) => {
  ctx.reply("🔥 Meme Bot Ready... mention karala katha karapan 😏");
});

bot.command("vip", (ctx) => {
  ctx.reply("💎 VIP Rs.300/month\nPay & send screenshot");
});

bot.on("text", async (ctx) => {
  if (!shouldReply(ctx)) return;

  const msg = ctx.message.text;
  const userId = ctx.from.id;

  if (Math.random() > 0.6) return;

  saveMemory(userId, msg);
  addScore(userId);

  await new Promise((r) =>
    setTimeout(r, 1000 + Math.random() * 2000)
  );

  const reply = await getAIReply(msg, userId);
  ctx.reply(reply);
});

bot.launch();
console.log("🔥 Bot Running...");

app.get("/", (req, res) => {
  res.send("Bot running...");
});

app.listen(3000, () => console.log("🌐 Dashboard running"));
