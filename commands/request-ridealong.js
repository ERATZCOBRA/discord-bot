require('dotenv').config();
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');

// Unicode horizontal line repeated 24 times for the blue line separator
const BLUE_LINE = '━'.repeat(24);

// Environment variables
const PING_ROLE_ID = process.env.RIDEALONG_ROLE_ID;
const TARGET_CHANNEL_ID = process.env.RIDEALONG_REQUEST_CHANNEL_ID;
const AUTHORIZED_ROLE_IDS = process.env.RIDEALONG_COMMAND_ACCESS_ROLE_IDS?.split(',') || [];
const REVIEWER_ROLE_IDS = process.env.RIDEALONG_REVIEWER_ROLE_IDS?.split(',') || [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ridealong-request')
    .setDescription('Submit a formal FBI ride-along request')
    .setDefaultMemberPermissions(null)
    .setDMPermission(false)
    .addStringOption(option =>
      option.setName('available-time')
        .setDescription('Your available time for the ride-along')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const user = interaction.user;

    // Check if user has permission
    if (!AUTHORIZED_ROLE_IDS.some(roleId => member.roles.cache.has(roleId))) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const availableTime = interaction.options.getString('available-time');
    const now = new Date();
    const formattedDateTime = now.toLocaleString('en-GB', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (!PING_ROLE_ID) {
      return interaction.reply({
        content: '❌ Ride-along ping role is not configured properly.',
        ephemeral: true,
      });
    }

    // Create the embed
    const embed = new EmbedBuilder()
      .setTitle('ㅤㅤㅤ<:FBI_Badge:1192100309137375305>  FBI Ride Along Request  <:FBI_Badge:1192100309137375305>ㅤㅤㅤ')
      .setDescription(
        `${BLUE_LINE}\n\n` +
        'I respectfully request approval for a ride-along opportunity to accompany an experienced agent during active duty. This experience will provide valuable insight and hands-on learning to enhance my skills as a probationary agent.\n\n' +
        `> **Probationary Agent:** ${user}\n` +
        `> **Available Time:** ${availableTime}\n` +
        `> **Ping:** <@&${PING_ROLE_ID}>\n` +
        `> **Status:** ⏳ Pending`
      )
      .setColor(0x0000ff)
      .setFooter({
        text: `Requested by, ${user.username} | On: ${formattedDateTime}`,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      });

    // Create buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ridealong_accept')
        .setLabel('✅ Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('ridealong_deny')
        .setLabel('❌ Deny')
        .setStyle(ButtonStyle.Danger)
    );

    try {
      // Fetch the target channel
      const targetChannel = await interaction.client.channels.fetch(TARGET_CHANNEL_ID);

      if (!targetChannel) {
        return interaction.reply({
          content: '❌ Could not find the ride-along request channel.',
          ephemeral: true,
        });
      }

      // Send the request message with buttons
      const message = await targetChannel.send({
        content: `<@&${PING_ROLE_ID}>`,
        embeds: [embed],
        components: [buttons],
      });

      // Start a thread for discussion
      await message.startThread({
        name: `Ride Along - ${user.username}`,
        autoArchiveDuration: 60,
        reason: 'Ride-along request thread created',
      });

      await interaction.reply({
        content: '✅ Your ride-along request has been submitted successfully.',
        ephemeral: true,
      });

      // Collector to handle button interactions
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      collector.on('collect', async i => {
        // Check if the reviewer has a permitted role
        const reviewerHasAccess = REVIEWER_ROLE_IDS.some(roleId => i.member.roles.cache.has(roleId));
        if (!reviewerHasAccess) {
          return i.reply({
            content: '❌ You do not have permission to review this request.',
            ephemeral: true,
          });
        }

        const decision = i.customId === 'ridealong_accept' ? '✅ Accepted' : '❌ Denied';
        const color = i.customId === 'ridealong_accept' ? 0x00ff00 : 0xff0000;

        // Update embed status
        const updatedEmbed = EmbedBuilder.from(message.embeds[0])
          .setColor(color)
          .setDescription(
            message.embeds[0].description.replace(
              /> \*\*Status:\*\* .*/g,
              `> **Status:** ${decision} by ${i.user}`
            )
          );

        // Edit message: embed + remove buttons
        await message.edit({ embeds: [updatedEmbed], components: [] });
        await i.reply({ content: `Ride-along request has been ${decision.toLowerCase()}.`, ephemeral: true });

        collector.stop();
      });

    } catch (error) {
      console.error('Error while processing ride-along request:', error);
      await interaction.reply({
        content: '❌ An unexpected error occurred while submitting your request.',
        ephemeral: true,
      });
    }
  },
};
