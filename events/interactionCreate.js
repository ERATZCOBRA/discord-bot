require('dotenv').config();
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
} = require('discord.js');

const PAGE_SIZE = 5;
const suggestionVotes = new Map(); // Key: messageId, Value: { up: Set(), down: Set() }

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // ========================
    // SUGGESTION VOTING BUTTONS
    // ========================
    if (interaction.isButton()) {
      const messageId = interaction.message.id;

      // Ensure the vote data exists
      if (!suggestionVotes.has(messageId)) {
        suggestionVotes.set(messageId, { up: new Set(), down: new Set() });
      }

      const votes = suggestionVotes.get(messageId);
      const userId = interaction.user.id;

      // Defer update to extend response time to 15 minutes
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate(); // No visible reply, just keeps it alive
      }

      if (interaction.customId === 'vote_up') {
        if (votes.down.has(userId)) votes.down.delete(userId);
        votes.up.has(userId) ? votes.up.delete(userId) : votes.up.add(userId);
        return updateVoteButtons(interaction, votes);
      }

      if (interaction.customId === 'vote_down') {
        if (votes.up.has(userId)) votes.up.delete(userId);
        votes.down.has(userId) ? votes.down.delete(userId) : votes.down.add(userId);
        return updateVoteButtons(interaction, votes);
      }

      if (interaction.customId === 'vote_list') {
        const up = Array.from(votes.up).map(id => `<@${id}>`).join('\n') || 'None';
        const down = Array.from(votes.down).map(id => `<@${id}>`).join('\n') || 'None';

        return interaction.followUp({
          ephemeral: true,
          embeds: [
            new EmbedBuilder()
              .setTitle('📋 Voter List')
              .addFields(
                { name: '⬆️ Upvoted', value: up, inline: true },
                { name: '⬇️ Downvoted', value: down, inline: true }
              )
              .setColor(0x2f3136),
          ],
        });
      }
    }

    // ========================
    // SLASH COMMANDS
    // ========================
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const timestamp = Math.floor(Date.now() / 1000);

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

    const logEmbed = new EmbedBuilder()
      .setTitle('📘 Command Log')
      .setDescription(`${interaction.user} used the \`/${interaction.commandName}\` command on <t:${timestamp}:F>.`)
      .setColor(0x2b2d31)
      .setFooter({ text: `User ID: ${interaction.user.id}` })
      .setTimestamp();

    const logChannel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({ embeds: [logEmbed] });
    } else {
      console.warn('⚠️ Logging channel not found. Check LOG_CHANNEL_ID in your .env file.');
    }
  },
};

// Helper to update vote buttons
function updateVoteButtons(interaction, votes) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('vote_up')
      .setLabel(`⬆️ ${votes.up.size}`)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('vote_down')
      .setLabel(`⬇️ ${votes.down.size}`)
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('vote_list')
      .setLabel('📋 Voters')
      .setStyle(ButtonStyle.Secondary)
  );

  return interaction.editReply({ components: [row] });
}
