const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');

// ✅ Load environment variables
dotenv.config();

// ✅ Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // Slash commands
    GatewayIntentBits.GuildMessages,    // Prefix commands
    GatewayIntentBits.MessageContent,   // Read message content
  ],
  partials: [Partials.Channel],
});

// ✅ Command Collections
client.commands = new Collection();       // Slash commands
client.prefixCommands = new Collection(); // Prefix commands
client.prefix = process.env.PREFIX || '-'; // Default prefix

// ============================
// 🧠 LOAD SLASH COMMANDS
// ============================
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[⚠️] Slash command at ${filePath} is missing "data" or "execute".`);
    }
  }
}

// ============================
// 🎯 LOAD PREFIX COMMANDS
// ============================
const prefixCommandsPath = path.join(__dirname, 'prefixCommands');
if (fs.existsSync(prefixCommandsPath)) {
  const prefixFiles = fs.readdirSync(prefixCommandsPath).filter(file => file.endsWith('.js'));
  for (const file of prefixFiles) {
    const filePath = path.join(prefixCommandsPath, file);
    const command = require(filePath);
    if ('name' in command && 'execute' in command) {
      client.prefixCommands.set(command.name.toLowerCase(), command);
    } else {
      console.warn(`[⚠️] Prefix command at ${filePath} is missing "name" or "execute".`);
    }
  }
}

// ============================
// ⚡ LOAD EVENTS
// ============================
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

// ============================
// 💬 PREFIX COMMAND HANDLER
// ============================
client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith(client.prefix)) return;

  const args = message.content.slice(client.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.prefixCommands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.error(`❌ Error executing prefix command "${commandName}":`, err);
    message.reply('⚠️ Something went wrong while executing that command.');
  }
});

// ============================
// 🌐 EXPRESS KEEP-ALIVE SERVER
// ============================
const app = express();
app.get('/', (req, res) => res.send('✅ Bot is alive and running!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌍 Express server running on port ${PORT}`));

// ============================
// 🔑 LOGIN BOT
// ============================
client.login(process.env.TOKEN).catch(err => {
  console.error('❌ Failed to login:', err);
});

