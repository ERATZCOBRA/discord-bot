require('dotenv').config();
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const suggestionVotes = new Map(); // Key: messageId, Value: { up: Set(), down: Set() }

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Submit a suggestion to the FBI')
    .addStringOption(option =>
      option.setName('suggestion')
        .setDescription('Your suggestion')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const suggestion = interaction.options.getString('suggestion');
    const suggestChannelId = process.env.SUGGEST_CHANNEL_ID;
    const roleMentions = process.env.SUGGEST_ROLE_IDS.split(',').map(id => `<@&${id.trim()}>`).join(' ');

    const channel = await client.channels.fetch(suggestChannelId);
    if (!channel) {
      return interaction.reply({ content: '❌ Suggestion channel not found.', ephemeral: true });
    }

    const centeredTitle = '‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎<:FBI_Badge:1192100309137375305> New Suggestion <:FBI_Badge:1192100309137375305>';
    const line = '━'.repeat(56); // Unicode full-width line

    const embed = new EmbedBuilder()
      .setTitle(centeredTitle)
      .setDescription(`${line}\n\n**Agent:** ${interaction.user}\n**Suggestion:** ${suggestion}`)
      .setColor(0x0000ff)
      .setFooter({
        text: `Suggested by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    const upButton = new ButtonBuilder()
      .setCustomId('vote_up')
      .setLabel('⬆️ 0')
      .setStyle(ButtonStyle.Success);

    const downButton = new ButtonBuilder()
      .setCustomId('vote_down')
      .setLabel('⬇️ 0')
      .setStyle(ButtonStyle.Danger);

    const listButton = new ButtonBuilder()
      .setCustomId('vote_list')
      .setLabel('📋 Voters')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(upButton, downButton, listButton);

    const message = await channel.send({
      content: `${roleMentions}`,
      embeds: [embed],
      components: [row],
    });

    // Store vote sets
    suggestionVotes.set(message.id, {
      up: new Set(),
      down: new Set()
    });

    // Auto-create thread titled after the suggestion (trimmed)
    await message.startThread({
      name: `Discussion: ${suggestion.slice(0, 40)}${suggestion.length > 40 ? '...' : ''}`,
      autoArchiveDuration: 1440,
      reason: `Suggestion by ${interaction.user.tag}`,
    });

    await interaction.reply({ content: '✅ Suggestion sent successfully!', ephemeral: true });
  },
};
