require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Promote a user to a new rank')
    .addUserOption(option =>
      option.setName('promoted-agent')
        .setDescription('User to promote')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('new-rank')
        .setDescription('New rank for the user')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('approved-by')
        .setDescription('Mention approvers (users/roles), separated by spaces or commas')
        .setRequired(true))
    .setDefaultMemberPermissions(null)
    .setDMPermission(false),

  async execute(interaction, client) {
    const allowedRoleIds = process.env.PROMOTE_ALLOWED_ROLE_IDS
      ? process.env.PROMOTE_ALLOWED_ROLE_IDS.split(',').map(id => id.trim())
      : [];

    const channelId = process.env.PROMOTE_LOG_CHANNEL_ID;

    const hasPermission = interaction.member.roles.cache.some(role =>
      allowedRoleIds.includes(role.id)
    );

    if (!hasPermission) {
      return interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
    }

    const promotedAgent = interaction.options.getUser('promoted-agent');
    const newRank = interaction.options.getRole('new-rank');
    const approvedByRaw = interaction.options.getString('approved-by');
    const requester = interaction.user;
    const time = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    await interaction.reply({ content: '✅ Promotion has been completed.', ephemeral: true });

    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      return interaction.followUp({ content: '❌ Promotion channel not found.', ephemeral: true });
    }

    const blueLine = '<:BlueLine:1372978644770750577>'.repeat(24);

    const embed = new EmbedBuilder()
      .setTitle('ㅤㅤㅤㅤㅤ<:FBI_Badge:1192100309137375305>  FBI Promotion  <:FBI_Badge:1192100309137375305>ㅤㅤㅤㅤㅤ')
      .setDescription(
        `${blueLine}\nCongratulations! Your dedication, discipline, and exceptional performance have not gone unnoticed. You are hereby promoted to <@&${newRank.id}>. May you continue to serve with honor and uphold the values of the Bureau.\n\nApproved by: ${approvedByRaw}`
      )
      .setColor(0x0000ff)
      .setFooter({
        text: `Signed by ${requester.username} | On ${time}`,
        iconURL: requester.displayAvatarURL({ dynamic: true }),
      });

    await channel.send({
      content: `<@${promotedAgent.id}>`,
      embeds: [embed],
    });
  },
};
