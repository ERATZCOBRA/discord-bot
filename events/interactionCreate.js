require('dotenv').config();
const {
  EmbedBuilder,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    const devUserId = process.env.DEV_USER_ID;

    // ================
    // SLASH COMMANDS
    // ================
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      const timestamp = Math.floor(Date.now() / 1000);
      let status = '✅ Success';
      let embedColor = 0x57F287; // Green for success
      let error; // track error

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        error = err;
        status = '❌ Failed';
        embedColor = 0xED4245; // Red for error

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ There was an error while executing this command.',
            ephemeral: true,
          });
        }
      }

      // Build log embed
      const logEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setAuthor({
          name: `${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTitle(`${status} — \`/${interaction.commandName}\``)
        .addFields(
          {
            name: '🧑‍💼 User',
            value: `> ${interaction.user} \`(${interaction.user.id})\``,
          },
          {
            name: '📨 Command',
            value: `> \`/${interaction.commandName}\` in <#${interaction.channelId}>`,
          },
          {
            name: '🕒 Timestamp',
            value: `> <t:${timestamp}:F> — <t:${timestamp}:R>`,
          }
        )
        .setFooter({
          text:
            status === '✅ Success'
              ? 'Command executed successfully'
              : 'Command failed to execute',
          iconURL:
            status === '✅ Success'
              ? 'https://cdn-icons-png.flaticon.com/512/845/845646.png'
              : 'https://cdn-icons-png.flaticon.com/512/463/463612.png',
        })
        .setTimestamp();

      if (status === '❌ Failed') {
        logEmbed.addFields({
          name: '💥 Error Details',
          value: `\`\`\`js\n${(error?.stack || error?.message || error)
            .toString()
            .slice(0, 950)}\n\`\`\``,
        });
      }

      // Send to log channel
      const logChannel = await client.channels
        .fetch(process.env.LOG_CHANNEL_ID)
        .catch(() => null);
      if (logChannel) {
        await logChannel.send({ embeds: [logEmbed] });
      } else {
        console.warn(
          '⚠️ Logging channel not found. Check LOG_CHANNEL_ID in your .env file.'
        );
      }
    }

    // ================
    // DEV BUTTONS
    // ================
    if (interaction.isButton()) {
      if (interaction.customId === 'dev_suggestion') {
        const modal = new ModalBuilder()
          .setCustomId('modal_suggestion')
          .setTitle('Submit a Suggestion');

        const suggestionInput = new TextInputBuilder()
          .setCustomId('suggestion_text')
          .setLabel('Your Suggestion')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        const reasonInput = new TextInputBuilder()
          .setCustomId('suggestion_reason')
          .setLabel('Reason')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(suggestionInput),
          new ActionRowBuilder().addComponents(reasonInput)
        );

        await interaction.showModal(modal);
      }

      if (interaction.customId === 'dev_feedback') {
        const modal = new ModalBuilder()
          .setCustomId('modal_feedback')
          .setTitle('Submit Feedback');

        const ratingInput = new TextInputBuilder()
          .setCustomId('feedback_rating')
          .setLabel('Rating out of 10')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const reasonInput = new TextInputBuilder()
          .setCustomId('feedback_reason')
          .setLabel('Reason')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(ratingInput),
          new ActionRowBuilder().addComponents(reasonInput)
        );

        await interaction.showModal(modal);
      }
    }

    // ================
    // DEV MODALS
    // ================
    if (interaction.isModalSubmit()) {
      const devUser = await client.users
        .fetch(devUserId)
        .catch(() => null);

      if (!devUser) {
        return interaction.reply({
          content: '⚠️ Could not find the developer to send your message.',
          ephemeral: true,
        });
      }

      if (interaction.customId === 'modal_suggestion') {
        const suggestion = interaction.fields.getTextInputValue('suggestion_text');
        const reason = interaction.fields.getTextInputValue('suggestion_reason');

        await devUser.send(
          `📩 **New Suggestion Received**\n\nFrom: ${interaction.user}\nType: Suggestion\n\nSuggestion: ${suggestion}\nReason: ${reason}`
        );

        await interaction.reply({
          content: '✅ Your suggestion has been sent!',
          ephemeral: true,
        });
      }

      if (interaction.customId === 'modal_feedback') {
        const rating = interaction.fields.getTextInputValue('feedback_rating');
        const reason = interaction.fields.getTextInputValue('feedback_reason');

        await devUser.send(
          `📩 **New Feedback Received**\n\nFrom: ${interaction.user}\nType: Feedback\n\nRating: ${rating}/10\nReason: ${reason}`
        );

        await interaction.reply({
          content: '✅ Your feedback has been sent!',
          ephemeral: true,
        });
      }
    }
  },
};
