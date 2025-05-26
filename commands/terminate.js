require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('terminate')
    .setDescription('Issue a termination-related punishment to a user')
    .addUserOption(option =>
      option.setName('punished-agent')
        .setDescription('User to punish')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type-of-punishment')
        .setDescription('Type of punishment')
        .setRequired(true)
        .addChoices(
          { name: 'Termination', value: 'Termination' },
          { name: 'Termination + Blacklist', value: 'Termination + Blacklist' },
          { name: 'Permanent Blacklist', value: 'Permanent Blacklist' },
          { name: '1 week Blacklist', value: '1 week Blacklist' },
          { name: '2 week Blacklist', value: '2 week Blacklist' }
        ))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the termination')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('appealable')
        .setDescription('Is the punishment appealable?')
        .setRequired(true)
        .addChoices(
          { name: 'Yes', value: 'Yes' },
          { name: 'No', value: 'No' }
        ))
    .addStringOption(option =>
      option.setName('approved-by')
        .setDescription('Mention approvers (users or roles)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('proof')
        .setDescription('Proof (Text/Links)')
        .setRequired(false)),

  async execute(interaction, client) {
    const allowedRoleIds = process.env.TERMINATE_ALLOWED_ROLE_IDS
      ? process.env.TERMINATE_ALLOWED_ROLE_IDS.split(',').map(id => id.trim())
      : [];

    const channelId = process.env.TERMINATE_LOG_CHANNEL_ID;

    const hasPermission = interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));
    if (!hasPermission) {
      return await interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const punishedAgent = interaction.options.getUser('punished-agent');
    const typeOfPunishment = interaction.options.getString('type-of-punishment');
    const reason = interaction.options.getString('reason');
    const appealable = interaction.options.getString('appealable');
    const approvedBy = interaction.options.getString('approved-by');
    const proof = interaction.options.getString('proof') || 'N/A.';

    const author = interaction.user.username;
    const authorAvatarURL = interaction.user.displayAvatarURL({ dynamic: true, size: 1024 });
    const time = new Date().toLocaleString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });

    await interaction.reply({ content: '✅ Termination has been logged.', ephemeral: true });

    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      return interaction.followUp({ content: '❌ Termination log channel not found.', ephemeral: true });
    }

    const blueLine = '<:b_line:1294034867230736425>'.repeat(24);

    const embed = new EmbedBuilder()
      .setTitle('ㅤㅤㅤㅤㅤㅤ<:FBI_Badge:1192100309137375305>  FBI Termination Notice  <:FBI_Badge:1192100309137375305>ㅤㅤㅤㅤㅤㅤ')
      .setDescription(
        `${blueLine}\nThe FBI Internal Affairs Team has completed its investigation and proceeded with a termination-related punishment. If you feel this decision is unjust, you may open an IA Ticket in <#1191435324593811486> with valid proof.\n\n` +
        `> **Punishment:** ${typeOfPunishment}\n` +
        `> **Reason:** ${reason}\n` +
        `> **Proof:** ${proof}\n` +
        `> **Appealable:** ${appealable}\n` +
        `> **Approved by:** ${approvedBy}`
      )
      .setColor(0x0000ff)
      .setFooter({
        text: `Signed by ${author} | On ${time}`,
        iconURL: authorAvatarURL,
      });

    await channel.send({
      content: `<@${punishedAgent.id}>`,
      embeds: [embed],
    });

    try {
      const dmChannel = await punishedAgent.createDM();
      await dmChannel.send({ embeds: [embed] });
    } catch (error) {
      console.log('Could not send DM to user:', error);
    }
  },
};
