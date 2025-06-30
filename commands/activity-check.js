require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activity-check')
    .setDescription('Initiate an official FBI activity check')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to mention in the activity check')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('number')
        .setDescription('Number of reactions expected')
        .setRequired(true)),

  async execute(interaction, client) {
    const allowedRoleIds = process.env.ACTIVITY_CHECK_ROLE_IDS
      ? process.env.ACTIVITY_CHECK_ROLE_IDS.split(',').map(id => id.trim())
      : [];

    const logChannelId = process.env.ACTIVITY_CHECK_CHANNEL_ID;
    const hasPermission = interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));

    if (!hasPermission) {
      return await interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const role = interaction.options.getRole('role');
    const expectedReactions = interaction.options.getInteger('number');

    const author = interaction.user.username;
    const authorAvatar = interaction.user.displayAvatarURL({ dynamic: true, size: 1024 });

    const channel = await client.channels.fetch(logChannelId);
    if (!channel) {
      return interaction.reply({
        content: '❌ Could not find the configured activity check channel.',
        ephemeral: true,
      });
    }

    // Updated line width
    const lineChar = '━';
    const lineLength = 32; // Adjusted from 24 to 32 for better width in embeds
    const horizontalLine = lineChar.repeat(lineLength);

    const embed = new EmbedBuilder()
      .setTitle('ㅤㅤ<:FBI_Badge:1192100309137375305>  FBI Activity Check  <:FBI_Badge:1192100309137375305>')
      .setDescription(
        `${horizontalLine}\n\n` +
        `This is an official activity check for all members of the Federal Bureau of Investigation to ensure operational readiness and engagement. Agents are required to confirm their active status by responding within the designated timeframe. Continued commitment and accountability are vital to the Bureau’s ongoing success.\n\n` +
        `I would like to see **${expectedReactions}** reactions for this activity check.`
      )
      .setColor(0x0000ff)
      .setFooter({ text: `Signed by ${author}`, iconURL: authorAvatar });

    const message = await channel.send({
      content: `${role}`,
      embeds: [embed],
    });

    try {
      await message.react('✅');
    } catch (err) {
      console.error('Failed to react:', err);
    }

    await interaction.reply({ content: '✅ Activity check has been sent.', ephemeral: true });
  },
};
