require('dotenv').config();
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const timestamp = Math.floor(Date.now() / 1000); // UNIX timestamp in seconds

    // 📘 Prepare the base log embed
    const logEmbed = new EmbedBuilder()
      .setTitle('📘 Command Log')
      .setDescription(`${interaction.user} used the \`/${interaction.commandName}\` command on <t:${timestamp}:F>.`)
      .setColor(0x2b2d31)
      .setFooter({ text: `User ID: ${interaction.user.id}` })
      .setTimestamp();

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ There was an error while executing this command.',
          ephemeral: true,
        });
      }
    }

    // 🔍 Log to the configured log channel from .env
    const logChannel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({ embeds: [logEmbed] });
    } else {
      console.warn('⚠️ Logging channel not found. Check LOG_CHANNEL_ID in your .env file.');
    }
  },
};
