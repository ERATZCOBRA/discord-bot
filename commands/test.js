const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('🔧 Run a diagnostic to confirm the bot is online and functional.'),

  async execute(interaction, client) {
    const channelId = process.env.TEST_COMMAND_CHANNEL_ID;
    const targetChannel = client.channels.cache.get(channelId);

    if (!targetChannel) {
      return interaction.reply({
        content: '❌ The configured channel for the test command was not found. Please check `TEST_COMMAND_CHANNEL_ID` in your .env.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Diagnostic Report')
      .setColor(0x57f287)
      .setDescription('The bot is **online** and all core functions are responding as expected.')
      .addFields(
        { name: '📡 Status', value: '`Operational` 🟢', inline: true },
        { name: '💻 Uptime', value: `<t:${Math.floor(client.readyAt.getTime() / 1000)}:R>`, inline: true },
        { name: '👤 Requested By', value: `<@${interaction.user.id}>`, inline: true },
        { name: '📅 Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
      )
      .setFooter({ text: `${client.user.username} System Check`, iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await targetChannel.send({
      content: `✅ Bot Diagnostic initiated by ${interaction.user}`,
      embeds: [embed],
    });

    await interaction.reply({
      content: `📨 Test result posted in <#${channelId}>.`,
      ephemeral: true,
    });
  },
};
