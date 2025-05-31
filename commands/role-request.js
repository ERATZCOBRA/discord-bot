const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');

require('dotenv').config();

const allowedCommandRoles = process.env.ROLE_REQUEST_COMMAND_ACCESS_ROLE_IDS.split(',').map(id => id.trim());
const buttonManagerRoles = process.env.ROLE_REQUEST_BUTTON_MANAGER_ROLE_IDS.split(',').map(id => id.trim());
const targetChannelId = process.env.ROLE_REQUEST_TARGET_CHANNEL_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role-request')
    .setDescription('Request a specific role within the FBI.')
    .addStringOption(option =>
      option.setName('role-requested')
        .setDescription('The role you are requesting')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason you are requesting this role')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('ping')
        .setDescription('Role to ping for review')
        .setRequired(true))
    .setDMPermission(false),

  async execute(interaction) {
    // Check command access
    const hasAccess = interaction.member.roles.cache.some(role =>
      allowedCommandRoles.includes(role.id)
    );

    if (!hasAccess) {
      return interaction.reply({
        content: '🚫 You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    // Get options
    const requester = interaction.user;
    const roleRequested = interaction.options.getString('role-requested');
    const reason = interaction.options.getString('reason');
    const pingRole = interaction.options.getRole('ping');

    // Use unicode line instead of emoji for compatibility
    const blueLine = '━'.repeat(24);
    const fbiEmoji = '<:FBI_Badge:1192100309137375305>';
    const timestamp = new Date().toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
      hour12: false
    });

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(`ㅤㅤㅤㅤㅤ${fbiEmoji}  Role Request  ${fbiEmoji}ㅤㅤㅤㅤㅤ`)
      .setDescription(`${blueLine}
I would like to formally request the assignment of the specified role(s) within the Federal Bureau of Investigation. I believe I meet the necessary qualifications and am committed to fulfilling the responsibilities that come with the role. I kindly ask for your consideration and approval of this request.

> **User:** <@${requester.id}>
> **Role Requested:** ${roleRequested}
> **Reason:** ${reason}
> **Status:** ⏳ Pending`)
      .setColor(0x0000ff)
      .setFooter({ text: `Requested by ${requester.username} | On ${timestamp}`, iconURL: requester.displayAvatarURL({ dynamic: true }) });

    // Buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept-role-request')
        .setLabel('✅ Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('deny-role-request')
        .setLabel('❌ Deny')
        .setStyle(ButtonStyle.Danger)
    );

    try {
      // Fetch channel (better than cache get)
      const targetChannel = await interaction.client.channels.fetch(targetChannelId);
      if (!targetChannel) {
        return interaction.reply({ content: '❌ Target channel not found.', ephemeral: true });
      }

      // Send message with embed and buttons
      const message = await targetChannel.send({
        content: `${pingRole}`,
        embeds: [embed],
        components: [buttons],
      });

      // Confirm to requester
      await interaction.reply({
        content: '✅ Your role request has been submitted for review.',
        ephemeral: true,
      });

      // Filter for button presses by allowed roles
      const filter = i =>
        ['accept-role-request', 'deny-role-request'].includes(i.customId) &&
        i.member.roles.cache.some(role => buttonManagerRoles.includes(role.id));

      // Collector for button clicks, 1 hour timeout
      const collector = message.createMessageComponentCollector({
        filter,
        time: 3600000,
        componentType: ComponentType.Button,
      });

      collector.on('collect', async i => {
        // Defer update to avoid timeout
        if (!i.deferred && !i.replied) await i.deferUpdate();

        // Determine status and color based on button
        const accepted = i.customId === 'accept-role-request';
        const statusText = accepted
          ? `✅ Accepted by <@${i.user.id}>`
          : `❌ Denied by <@${i.user.id}>`;
        const statusColor = accepted ? 0x00b050 : 0xff0000;

        // Update embed description replacing "⏳ Pending" with statusText
        const updatedDescription = embed.data.description.replace('⏳ Pending', statusText);

        // Create updated embed with new color, description, and footer with decision time
        const updatedEmbed = EmbedBuilder.from(embed)
          .setColor(statusColor)
          .setDescription(updatedDescription)
          .setFooter({
            text: `Decision by ${i.user.tag} • On ${new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short', hour12: false })}`,
            iconURL: i.user.displayAvatarURL({ dynamic: true }),
          });

        // Disable buttons
        const disabledButtons = new ActionRowBuilder().addComponents(
          ...buttons.components.map(button => button.setDisabled(true))
        );

        // Edit the original message to update embed and disable buttons
        await message.edit({
          embeds: [updatedEmbed],
          components: [disabledButtons],
        });

        // Optionally, reply privately to the reviewer (deferred above)
        // await i.followUp({ content: `Role request has been ${accepted ? 'accepted' : 'denied'}.`, ephemeral: true });

        collector.stop();
      });

    } catch (error) {
      console.error('Error sending role request:', error);
      return interaction.reply({
        content: '❌ An error occurred while submitting your request.',
        ephemeral: true,
      });
    }
  },
};
