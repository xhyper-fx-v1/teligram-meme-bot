require("dotenv").config();
const { Telegraf } = require("telegraf");
const axios = require("axios");
const express = require("express");

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// ===== DATA =====
const vipUsers = new Set();
const memory = {};
const scores = {};

const OWNER_ID = Number(process.env.OWNER_ID);

// ===== FUNCTIONS =====
function isOwner(ctx) {
  return ctx.from.id === OWNER_ID;
}

// 🎯 SMART REPLY SYSTEM (UPDATED 🔥)
function shouldReply(ctx) {
  const msg = ctx.message;

  if (!msg.text) return false;

  // always reply if mentioned
  if (msg.text.includes(`@${ctx.botInfo.username}`)) return true;

  // reply if replying to bot
  if (
    msg.reply_to_message &&
    msg.reply_to_message.from.username === ctx.botInfo.username
  ) {
    return true;
  }

  // random replies (20%)
  if (Math.random() < 0.2) return true;

  return false;
}

function addScore(id) {
  if (!scores[id]) scores[id] = 0;
  scores[id]++;
}

function saveMemory(id, msg) {
  if (!memory[id]) memory[id] = [];
  memory[id].push(msg);

  if (memory[id].length > 5) {
    memory[id].shift();
  }
}

// ===== AI FUNCTION =====
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
- Very funny, short replies (max 10 words)
- Use slang: bn, aiyo, mokada, hari hari
- Sometimes roast users
- Be unpredictable and fun
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
          Authorization: \`Bearer \${process.env.AI_KEY}\`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data.choices[0].message.content;
  } catch (err) {
    return "aiyo brain lag una 😂";
  }
}

// ===== COMMANDS =====

// start
bot.start((ctx) => {
  ctx.reply("🔥 Meme Bot Active... mention karala katha karapan 😏");
});

// VIP info
bot.command("vip", (ctx) => {
  ctx.reply("💎 VIP Rs.300/month\nPay & send screenshot 😏");
});

// add VIP (owner only)
bot.command("addvip", (ctx) => {
  if (!isOwner(ctx)) return;

  const id = ctx.message.text.split(" ")[1];
  vipUsers.add(Number(id));

  ctx.reply("🔥 VIP added");
});

// leaderboard
bot.command("top", (ctx) => {
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  let text = "🔥 Top Users:\n";
  sorted.forEach(([id, score], i) => {
    text += \`\${i + 1}. \${score} points\n\`;
  });

  ctx.reply(text);
});

// ===== MAIN BOT =====
bot.on("text", async (ctx) => {
  if (!shouldReply(ctx)) return;

  const msg = ctx.message.text;
  const userId = ctx.from.id;

  const isVIP = vipUsers.has(userId);

  // VIP gets more replies
  if (!isVIP && Math.random() > 0.6) return;

  // save memory + score
  saveMemory(userId, msg);
  addScore(userId);

  // delay (human feel)
  await new Promise((r) =>
    setTimeout(r, 1000 + Math.random() * 2000)
  );

  const reply = await getAIReply(msg, userId);

  // sometimes mention name
  if (Math.random() < 0.3) {
    return ctx.reply(\`\${ctx.from.first_name} \${reply}\`);
  }

  ctx.reply(reply);
});

// ===== START BOT =====
bot.launch();
console.log("🔥 Meme Bot Running...");

// ===== DASHBOARD =====
app.get("/", (req, res) => {
  res.send("Bot is running 😏");
});

app.listen(3000, () => {
  console.log("🌐 Dashboard running on port 3000");
});
