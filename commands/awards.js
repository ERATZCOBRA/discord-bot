require('dotenv').config();
const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const BLUE_LINE = '<:BlueLine:1372978644770750577>'.repeat(24);

// Role access and target channel ID from .env
const AWARD_COMMAND_ACCESS_ROLE_IDS = process.env.AWARD_COMMAND_ACCESS_ROLE_IDS?.split(',') || [];
const AWARD_TARGET_CHANNEL_ID = process.env.AWARD_TARGET_CHANNEL_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('award')
    .setDescription('Officially grant an award to an agent')
    .addUserOption(option =>
      option.setName('agent')
        .setDescription('Agent receiving the award')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('award')
        .setDescription('Name of the award being granted')
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName('approved-by')
        .setDescription('Person who approved the award')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;

    // Check if user has access
    const hasAccess = AWARD_COMMAND_ACCESS_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));
    if (!hasAccess) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const agent = interaction.options.getUser('agent');
    const award = interaction.options.getString('award');
    const approvedBy = interaction.options.getUser('approved-by');

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    const embed = new EmbedBuilder()
      .setTitle('ㅤㅤㅤ<:FBI_Badge:1192100309137375305>  FBI Awards  <:FBI_Badge:1192100309137375305>ㅤㅤㅤ')
      .setDescription(
        `${BLUE_LINE}\n\n` +
        `The Federal Bureau of Investigation is proud to present the **${award}** to ${agent} in recognition of their outstanding performance and dedication to duty. Their exceptional contributions have significantly supported the agency’s mission and values. We commend them for their excellence and commitment to the Bureau.\n\n` +
        `**Approved by:** ${approvedBy}`
      )
      .setColor(0x0000ff)
      .setFooter({
        text: `Signed by, ${interaction.user.username} • Time: ${formattedTime}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    try {
      const targetChannel = await interaction.client.channels.fetch(AWARD_TARGET_CHANNEL_ID);

      if (!targetChannel) {
        return interaction.reply({
          content: '❌ Could not find the award announcement channel.',
          ephemeral: true,
        });
      }

      // Mention the agent above the embed
      await targetChannel.send({
        content: `${agent}`,
        embeds: [embed],
      });

      await interaction.reply({
        content: '✅ Award announcement successfully posted.',
        ephemeral: true,
      });

    } catch (error) {
      console.error('Error posting award:', error);
      await interaction.reply({
        content: '❌ An unexpected error occurred while posting the award.',
        ephemeral: true,
      });
    }
  },
};
