const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');

require('dotenv').config();

const allowedCommandRoles = process.env.ROLE_REQUEST_COMMAND_ACCESS_ROLE_IDS.split(',');
const buttonManagerRoles = process.env.ROLE_REQUEST_BUTTON_MANAGER_ROLE_IDS.split(',');
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
    .setDMPermission(false)
    .setDefaultMemberPermissions(0n), // Hide from all by default

  async execute(interaction) {
    // ✅ Role check for visibility and access
    const hasAccess = interaction.member.roles.cache.some(role =>
      allowedCommandRoles.includes(role.id)
    );

    if (!hasAccess) {
      return interaction.reply({
        content: '🚫 You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    // Command logic
    const requester = interaction.user;
    const roleRequested = interaction.options.getString('role-requested');
    const reason = interaction.options.getString('reason');
    const pingRole = interaction.options.getRole('ping');

    const blueLine = '<:BlueLine:1371728240128819250>'.repeat(24);
    const fbiEmoji = '<:FBI:1371728059182485524>';
    const timestamp = new Date().toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
      hour12: false
    });

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

    const targetChannel = interaction.guild.channels.cache.get(targetChannelId);
    if (!targetChannel) {
      return interaction.reply({ content: '❌ Target channel not found.', ephemeral: true });
    }

    const message = await targetChannel.send({
      content: `${pingRole}`,
      embeds: [embed],
      components: [buttons],
    });

    await interaction.reply({
      content: '✅ Your role request has been submitted for review.',
      ephemeral: true,
    });

    const filter = i =>
      ['accept-role-request', 'deny-role-request'].includes(i.customId) &&
      i.member.roles.cache.some(role => buttonManagerRoles.includes(role.id));

    const collector = message.createMessageComponentCollector({
      filter,
      time: 3600000,
      componentType: ComponentType.Button,
    });

    collector.on('collect', async i => {
      if (!i.deferred) await i.deferUpdate();

      let statusText, statusColor;

      if (i.customId === 'accept-role-request') {
        statusText = `✅ Accepted by <@${i.user.id}>`;
        statusColor = 0x00b050;
      } else {
        statusText = `❌ Denied by <@${i.user.id}>`;
        statusColor = 0xff0000;
      }

      const updatedEmbed = EmbedBuilder.from(embed)
        .setColor(statusColor)
        .setDescription(embed.data.description.replace('⏳ Pending', statusText))
        .setFooter({
          text: `Decision by ${i.user.tag} • On ${new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short', hour12: false })}`,
          iconURL: i.user.displayAvatarURL({ dynamic: true }),
        });

      const disabledButtons = new ActionRowBuilder().addComponents(
        buttons.components.map(button => button.setDisabled(true))
      );

      await i.editReply({
        embeds: [updatedEmbed],
        components: [disabledButtons],
      });

      collector.stop();
    });
  },
};
