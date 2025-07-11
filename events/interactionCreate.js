require('dotenv').config();
const {
  EmbedBuilder,
  Events,
} = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // ================
    // SLASH COMMANDS
    // ================
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const timestamp = Math.floor(Date.now() / 1000);
    let status = '✅ Success';
    let embedColor = 0x57F287; // Green color for success

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      status = '❌ Failed';
      embedColor = 0xED4245; // Red color for error

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ There was an error while executing this command.',
          ephemeral: true,
        });
      }
    }

    // Build the log embed
    const logEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setAuthor({
        name: `${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTitle(`${status} — \`/${interaction.commandName}\``)
      .addFields(
        {
          name: '🧑‍💼 User',
          value: `> ${interaction.user} \`(${interaction.user.id})\``,
          inline: false,
        },
        {
          name: '📨 Command',
          value: `> \`/${interaction.commandName}\` in <#${interaction.channelId}>`,
          inline: false,
        },
        {
          name: '🕒 Timestamp',
          value: `> <t:${timestamp}:F> — <t:${timestamp}:R>`,
          inline: false,
        }
      )
      .setFooter({
        text: status === '✅ Success' ? 'Command executed successfully' : 'Command failed to execute',
        iconURL: status === '✅ Success'
          ? 'https://cdn-icons-png.flaticon.com/512/845/845646.png'
          : 'https://cdn-icons-png.flaticon.com/512/463/463612.png',
      })
      .setTimestamp();

    if (status === '❌ Failed') {
      logEmbed.addFields({
        name: '💥 Error Details',
        value:
          `\`\`\`js\n${(error?.stack || error?.message || error).toString().slice(0, 950)}\n\`\`\``
      });
    }

    // Send the log to the log channel
    const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
    if (logChannel) {
      await logChannel.send({ embeds: [logEmbed] });
    } else {
      console.warn('⚠️ Logging channel not found. Check LOG_CHANNEL_ID in your .env file.');
    }
  },
};
