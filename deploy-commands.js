const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

console.log('Loaded token:', process.env.TOKEN ? '[TOKEN LOADED]' : '[NO TOKEN]');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[WARNING] The command at ./commands/${file} is missing "data" or "execute".`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`⏳ Registering ${commands.length} application (/) commands...`);

    // Deploy all commands
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Successfully registered all application (/) commands.');

    // Fetch and log registered commands to verify
    const registeredCommands = await rest.get(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
    );
    console.log('Registered commands:', registeredCommands.map(cmd => cmd.name));

  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
})();
