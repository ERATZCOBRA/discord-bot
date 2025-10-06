const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');

// ✅ Load environment variables
dotenv.config();

// ✅ Initialize client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // For slash commands
    GatewayIntentBits.GuildMessages, // For prefix commands
    GatewayIntentBits.MessageContent // For reading prefix command messages
  ],
  partials: [Partials.Channel]
});

// ✅ Command Collections
client.commands = new Collection();
client.prefixCommands = new Collection();

// ✅ Define prefix (easy to change)
client.prefix = process.env.PREFIX || '-';

// ✅ Load Slash Commands
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

// ✅ Load Events
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

// ✅ Prefix Command Handler (e.g. for -tobi)
client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith(client.prefix)) return;

  const args = message.content.slice(client.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const commandPath = path.join(__dirname, 'prefixCommands', `${commandName}.js`);
  if (fs.existsSync(commandPath)) {
    const command = require(commandPath);
    try {
      await command.execute(message, args, client);
    } catch (err) {
      console.error(err);
      message.reply('❌ There was an error executing that command.');
    }
  }
});

// ✅ Express Server for Hosting (e.g. Render)
const app = express();
app.get('/', (req, res) => res.send('✅ Bot is running!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Express server listening on port ${PORT}`));

// ✅ Login
client.login(process.env.TOKEN);
