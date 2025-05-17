const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express'); // Added express

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// Load commands from ./commands/
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commandsArray = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commandsArray.push(command.data.toJSON());
  } else {
    console.warn(`[WARNING] The command at ./commands/${file} is missing "data" or "execute".`);
  }
}

// Load events from ./events/
const eventsPath = path.join(__dirname, 'events');
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

// Express server to keep Render happy and bot alive
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});

client.once('ready', async () => {
  console.log('✅ Bot is ready!');
});

client.login(process.env.TOKEN);