const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express'); // Added express
const { Client, GatewayIntentBits } = require('discord.js'); // Make sure this is here if using discord.js v14

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds] // Add your required intents here
});

// Your event loading code (just assuming it's like this)
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// ✅ Express server to keep Render alive
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});

// ✅ Start the bot
client.once('ready', async () => {
  console.log('✅ Bot is ready!');
});

client.login(process.env.TOKEN);
