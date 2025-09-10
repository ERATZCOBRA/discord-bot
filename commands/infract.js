require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infract')
    .setDescription('Issue an infraction to a user')
    .addUserOption(option =>
      option.setName('punished-agent')
        .setDescription('User to punish')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type-of-punishment')
        .setDescription('Type of punishment')
        .setRequired(true)
        .addChoices(
          { name: 'Notice', value: 'Notice' },
          { name: 'Warning', value: 'Warning' },
          { name: 'Strike', value: 'Strike' },
          { name: 'Warning + Shift Void', value: 'Warning + Shift Void' },
          { name: 'Strike + Shift Void', value: 'Strike + Shift Void' },
          { name: 'Suspension', value: 'Suspension' },
          { name: 'Retraining', value: 'Retraining' }
        ))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the infraction')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('appealable-after')
        .setDescription('When can the punishment be appealed?')
        .setRequired(true)
        .addChoices(
          { name: '1 week', value: '1_week' },
          { name: '2 weeks', value: '2_weeks' },
          { name: '1 month', value: '1_month' },
          { name: 'Unappealable', value: 'Unappealable' },
          { name: 'N/A', value: 'N/A' }
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
    const allowedRoleIds = process.env.INFRACT_ALLOWED_ROLE_IDS
      ? process.env.INFRACT_ALLOWED_ROLE_IDS.split(',').map(id => id.trim())
      : [];

    const channelId = process.env.INFRACT_LOG_CHANNEL_ID;

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
    const appealableAfter = interaction.options.getString('appealable-after');
    const approvedBy = interaction.options.getString('approved-by');
    const proof = interaction.options.getString('proof') || 'N/A.';

    const author = interaction.user.username;
    const authorAvatarURL = interaction.user.displayAvatarURL({ dynamic: true, size: 1024 });
    const time = new Date().toLocaleString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });

    // Calculate timestamp if applicable
    let appealableDisplay;
    const now = new Date();
    if (appealableAfter === '1_week') {
      const appealDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      appealableDisplay = `<t:${Math.floor(appealDate.getTime() / 1000)}:D>`;
    } else if (appealableAfter === '2_weeks') {
      const appealDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      appealableDisplay = `<t:${Math.floor(appealDate.getTime() / 1000)}:D>`;
    } else if (appealableAfter === '1_month') {
      const appealDate = new Date(now.setMonth(now.getMonth() + 1));
      appealableDisplay = `<t:${Math.floor(appealDate.getTime() / 1000)}:D>`;
    } else {
      appealableDisplay = appealableAfter;
    }

    await interaction.reply({ content: '✅ Infraction has been logged.', ephemeral: true });

    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      return interaction.followUp({ content: '❌ Infraction log channel not found.', ephemeral: true });
    }

    const blueLine = '━'.repeat(24);

    const embed = new EmbedBuilder()
      .setTitle('ㅤㅤㅤㅤㅤㅤㅤ<:FBI_Badge:1192100309137375305>  FBI Infraction  <:FBI_Badge:1192100309137375305>ㅤㅤㅤㅤㅤㅤㅤ')
      .setDescription(
        `${blueLine}\nThe FBI Internal Affairs Team has completed its investigation and proceeded with disciplinary actions against you. If you feel like this Infraction is false, please open an IA Ticket in <#1191435324593811486> with valid proof.\n\n` +
        `> **Punishment:** ${typeOfPunishment}\n` +
        `> **Reason:** ${reason}\n` +
        `> **Proof:** ${proof}\n` +
        `> **Appealable After:** ${appealableDisplay}\n` +
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
