require('dotenv').config();
const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ComponentType,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const AUTHORIZED_ROLE_ID = process.env.EMBED_COMMAND_ACCESS_ROLE_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create and send a custom embed to a selected channel.')
    .setDefaultMemberPermissions(0n)
    .setDMPermission(false)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to send the embed to')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction, previousData = null) {
    const member = interaction.member;

    // Permission check
    if (!AUTHORIZED_ROLE_ID || !member.roles.cache.has(AUTHORIZED_ROLE_ID)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    // Get target channel
    const targetChannel = interaction.options?.getChannel('channel') || previousData?.channel;

    // Prepare modal with pre-filled values if editing
    const modal = new ModalBuilder()
      .setCustomId('embedModal')
      .setTitle('Embed Setup');

    const titleInput = new TextInputBuilder()
      .setCustomId('embedTitle')
      .setLabel('Embed Title')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(previousData?.title || '');

    const descriptionInput = new TextInputBuilder()
      .setCustomId('embedDescription')
      .setLabel('Embed Description')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setValue(previousData?.description || '');

    const colorInput = new TextInputBuilder()
      .setCustomId('embedColor')
      .setLabel('Hex Color (e.g. #0099ff)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(previousData?.color || '');

    const footerInput = new TextInputBuilder()
      .setCustomId('embedFooter')
      .setLabel('Footer Text (optional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(previousData?.footer || '');

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descriptionInput),
      new ActionRowBuilder().addComponents(colorInput),
      new ActionRowBuilder().addComponents(footerInput)
    );

    // Show modal
    if (interaction.isModalSubmit && interaction.customId === 'embedModal') {
      // This is a modal submit interaction, so respond to it immediately
      await interaction.showModal(modal);
    } else {
      await interaction.showModal(modal);
    }

    // Wait for modal submit
    let modalSubmit;
    try {
      modalSubmit = await interaction.awaitModalSubmit({
        filter: i => i.customId === 'embedModal' && i.user.id === interaction.user.id,
        time: 300000,
      });
    } catch {
      return interaction.followUp({
        content: '❌ You did not submit the modal in time.',
        ephemeral: true,
      });
    }

    // Extract values
    const embedTitle = modalSubmit.fields.getTextInputValue('embedTitle');
    const embedDescription = modalSubmit.fields.getTextInputValue('embedDescription');
    const embedColorRaw = modalSubmit.fields.getTextInputValue('embedColor');
    const embedFooter = modalSubmit.fields.getTextInputValue('embedFooter');

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(embedTitle)
      .setDescription(embedDescription)
      .setColor(embedColorRaw || '#0099ff')
      .setTimestamp();

    if (embedFooter) {
      embed.setFooter({
        text: embedFooter,
        iconURL: modalSubmit.user.displayAvatarURL(),
      });
    }

    // Buttons: Confirm, Edit, Cancel
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_embed_send')
        .setLabel('✅ Confirm Send')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('edit_embed')
        .setLabel('✏️ Edit')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('cancel_embed_send')
        .setLabel('❌ Cancel')
        .setStyle(ButtonStyle.Danger)
    );

    // Reply with preview + buttons (ephemeral)
    await modalSubmit.reply({
      content: `Preview your embed below. Send to <#${targetChannel.id}>?`,
      embeds: [embed],
      components: [buttons],
      ephemeral: true,
    });

    // Await button interaction
    try {
      const buttonInteraction = await modalSubmit.channel.awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id,
        componentType: ComponentType.Button,
        time: 60000,
      });

      if (buttonInteraction.customId === 'confirm_embed_send') {
        await targetChannel.send({ embeds: [embed] });
        await buttonInteraction.update({
          content: '✅ Embed sent successfully!',
          components: [],
          embeds: [],
        });
      } else if (buttonInteraction.customId === 'cancel_embed_send') {
        await buttonInteraction.update({
          content: '❌ Embed sending canceled.',
          components: [],
          embeds: [],
        });
      } else if (buttonInteraction.customId === 'edit_embed') {
        // Close current button message before reopening modal for edit
        await buttonInteraction.update({
          content: '✏️ Opening modal to edit your embed...',
          components: [],
          embeds: [],
        });

        // Re-run execute with previous input data for edit
        return this.execute(interaction, {
          channel: targetChannel,
          title: embedTitle,
          description: embedDescription,
          color: embedColorRaw,
          footer: embedFooter,
        });
      }
    } catch {
      await modalSubmit.followUp({
        content: '❌ You did not click a button in time.',
        ephemeral: true,
      });
    }
  },
};
