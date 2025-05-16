// clear-global-commands.js
const { REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🧹 Clearing ALL global slash commands...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
    console.log('✅ Global slash commands cleared.');
  } catch (err) {
    console.error('❌ Failed to clear global commands:', err);
  }
})();
