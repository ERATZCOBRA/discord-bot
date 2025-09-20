require('dotenv').config();
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  // Slash command setup
  data: new SlashCommandBuilder()
    .setName('cidmass')
    .setDescription('Announce a CID mass shift operation')
    .addStringOption(option =>
      option.setName('location')
        .setDescription('Location of the mass shift')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for hosting the mass')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('promotional')
        .setDescription('Is this shift promotional?')
        .setRequired(true)
        .addChoices(
          { name: 'Yes', value: 'Yes' },
          { name: 'No', value: 'No' }
        ))
    .addUserOption(option =>
      option.setName('co-host')
        .setDescription('User co-hosting the mass (optional)')
        .setRequired(false)),

  async execute(interaction, client) {
    const {
      HOST_CID_MASS_ALLOWED_ROLE_ID,
      HOST_CID_MASS_ANNOUNCE_CHANNEL_ID,
      CID_DIVISION_ROLE_ID
    } = process.env;

    const allowedRoleIds = HOST_CID_MASS_ALLOWED_ROLE_ID.split(',').map(id => id.trim()).filter(Boolean);
    const hasPermission = interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));
    if (!hasPermission) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const location = interaction.options.getString('location');
    const reason = interaction.options.getString('reason');
    const promotional = interaction.options.getString('promotional');
    const coHostUser = interaction.options.getUser('co-host');
    const coHost = coHostUser ? `${coHostUser}` : 'N/A';

    const author = interaction.user.username;
    const authorAvatarURL = interaction.user.displayAvatarURL({ dynamic: true, size: 1024 });

    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const title = 'ㅤㅤㅤㅤCID Mass Shiftㅤㅤㅤㅤ';
    const mentionRole = `<@&${CID_DIVISION_ROLE_ID}>`;
    const line = '━'.repeat(40);

    const channel = await client.channels.fetch(HOST_CID_MASS_ANNOUNCE_CHANNEL_ID).catch(() => null);
    if (!channel) {
      return interaction.reply({
        content: '❌ Announcement channel not found. Please contact an admin.',
        ephemeral: true,
      });
    }

    await interaction.reply({ content: '✅ Mass hosting announcement posted.', ephemeral: true });

    const embed = {
      title,
      description:
        `${line}\n` +
        `The Criminal Investigation Division is currently hosting a mass shift operation to enhance coordination and readiness across all active units. Agents are required to report for duty as scheduled and carry out their assignments with full professionalism. This initiative is part of ongoing efforts to maintain peak operational efficiency within the Division.\n\n` +
        `> **Hosted by:** ${interaction.user}\n` +
        `> **Co-host:** ${coHost}\n` +
        `> **Location:** ${location}\n` +
        `> **Reason:** ${reason}\n` +
        `> **Promotional:** ${promotional}`,
      color: 0x0000ff,
      footer: {
        text: `Signed by ${author} | ${dayOfWeek}, Time: ${time}`,
        icon_url: authorAvatarURL,
      },
    };

    const message = await channel.send({
      content: mentionRole,
      embeds: [embed],
    });

    const reactions = ['✅', '❔', '❌'];
    try {
      for (const emoji of reactions) {
        await message.react(emoji);
      }
    } catch (error) {
      console.error('Failed to add reactions:', error);
    }
  },
};
