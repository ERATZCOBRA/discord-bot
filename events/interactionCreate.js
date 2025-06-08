require('dotenv').config();
const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
} = require('discord.js');

const db = require('../infractionDatabase');
const PAGE_SIZE = 5;
const suggestionVotes = new Map(); // Key: messageId, Value: { up: Set(), down: Set() }

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // ========================
    // SUGGESTION VOTING BUTTONS
    // ========================
    if (interaction.isButton()) {
      const messageId = interaction.message.id;

      // Initialize if not present
      if (!suggestionVotes.has(messageId)) {
        suggestionVotes.set(messageId, { up: new Set(), down: new Set() });
      }

      const votes = suggestionVotes.get(messageId);
      const userId = interaction.user.id;

      if (interaction.customId === 'vote_up') {
        if (votes.down.has(userId)) votes.down.delete(userId);
        votes.up.has(userId) ? votes.up.delete(userId) : votes.up.add(userId);

        return updateVoteButtons(interaction, votes);
      }

      if (interaction.customId === 'vote_down') {
        if (votes.up.has(userId)) votes.up.delete(userId);
        votes.down.has(userId) ? votes.down.delete(userId) : votes.down.add(userId);

        return updateVoteButtons(interaction, votes);
      }

      if (interaction.customId === 'vote_list') {
        const up = Array.from(votes.up).map(id => `<@${id}>`).join('\n') || 'None';
        const down = Array.from(votes.down).map(id => `<@${id}>`).join('\n') || 'None';

        return interaction.reply({
          ephemeral: true,
          embeds: [
            new EmbedBuilder()
              .setTitle('📋 Voter List')
              .addFields(
                { name: '⬆️ Upvoted', value: up, inline: true },
                { name: '⬇️ Downvoted', value: down, inline: true }
              )
              .setColor(0x2f3136),
          ],
        });
      }
    }

    // ========================
    // INFRACTION BUTTONS / MODALS
    // ========================
    if (interaction.isButton()) {
      if (interaction.customId === 'void_infraction') {
        const modal = new ModalBuilder()
          .setCustomId('void_infraction_modal_start')
          .setTitle('Void Infraction - Enter Case ID');

        const caseIdInput = new TextInputBuilder()
          .setCustomId('case_id_input')
          .setLabel('Infraction Case ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter the Case ID to void')
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(caseIdInput));
        return interaction.showModal(modal);
      }

      if (
        interaction.customId.startsWith('infractions_prev_') ||
        interaction.customId.startsWith('infractions_next_')
      ) {
        const parts = interaction.customId.split('_');
        const direction = parts[1]; // prev or next
        const targetUserId = parts[2];
        let page = parseInt(parts[3]);

        page += direction === 'prev' ? -1 : 1;

        db.all(
          'SELECT * FROM infractions WHERE user_id = ? ORDER BY timestamp DESC',
          [targetUserId],
          async (err, rows) => {
            if (err || !rows.length) {
              return interaction.update({
                content: '❌ Could not fetch infractions.',
                embeds: [],
                components: [],
                ephemeral: true,
              });
            }

            const pages = [];
            for (let i = 0; i < rows.length; i += PAGE_SIZE) {
              pages.push(rows.slice(i, i + PAGE_SIZE));
            }

            if (page < 0) page = 0;
            if (page >= pages.length) page = pages.length - 1;

            const embed = await createEmbed(pages[page], page, pages.length, targetUserId, interaction, client);
            const buttons = createButtons(page, pages.length, targetUserId);

            await interaction.update({ embeds: [embed], components: [buttons] });
          }
        );

        return;
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'void_infraction_modal_start') {
        const caseId = interaction.fields.getTextInputValue('case_id_input');

        db.get('SELECT * FROM infractions WHERE id = ?', [caseId], (err, infraction) => {
          if (err) {
            console.error(err);
            return interaction.reply({
              content: '❌ Database error occurred.',
              ephemeral: true,
            });
          }

          if (!infraction) {
            return interaction.reply({
              content: `❌ No infraction found with Case ID #${caseId}`,
              ephemeral: true,
            });
          }

          db.run('DELETE FROM infractions WHERE id = ?', [caseId], function (deleteErr) {
            if (deleteErr) {
              console.error(deleteErr);
              return interaction.reply({
                content: '❌ Failed to delete the infraction.',
                ephemeral: true,
              });
            }

            return interaction.reply({
              content: `✅ Infraction #${caseId} has been voided.`,
              ephemeral: true,
            });
          });
        });

        return;
      }
    }

    // ========================
    // SLASH COMMANDS
    // ========================
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const timestamp = Math.floor(Date.now() / 1000);

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ There was an error while executing this command.',
          ephemeral: true,
        });
      }
    }

    const logEmbed = new EmbedBuilder()
      .setTitle('📘 Command Log')
      .setDescription(`${interaction.user} used the \`/${interaction.commandName}\` command on <t:${timestamp}:F>.`)
      .setColor(0x2b2d31)
      .setFooter({ text: `User ID: ${interaction.user.id}` })
      .setTimestamp();

    const logChannel = client.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({ embeds: [logEmbed] });
    } else {
      console.warn('⚠️ Logging channel not found. Check LOG_CHANNEL_ID in your .env file.');
    }
  },
};

// Helper for infractions
async function createEmbed(pageRows, pageIndex, totalPages, targetUserId, interaction, client) {
  const fields = await Promise.all(
    pageRows.map(async infraction => {
      let punisherUser;
      try {
        punisherUser = await client.users.fetch(infraction.punisher_id);
      } catch {
        punisherUser = { tag: 'Unknown User' };
      }

      const dateObj = new Date(infraction.timestamp);
      const formattedDate = dateObj.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      return {
        name: `Case ID: #${infraction.id}`,
        value:
          `**Issued by:** <@${infraction.punisher_id}> (${punisherUser.tag})\n` +
          `**Punishment:** ${infraction.punishment}\n` +
          `**Reason:** ${infraction.reason}\n` +
          `**Timestamp:** ${formattedDate}`,
      };
    })
  );

  return new EmbedBuilder()
    .setTitle(`Infractions for <@${targetUserId}> (Page ${pageIndex + 1}/${totalPages})`)
    .addFields(fields)
    .setColor(0xff0000)
    .setFooter({ text: `Requested by ${interaction.user.tag}` })
    .setTimestamp();
}

function createButtons(pageIndex, totalPages, userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`infractions_prev_${userId}_${pageIndex}`)
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageIndex === 0),
    new ButtonBuilder()
      .setCustomId(`infractions_next_${userId}_${pageIndex}`)
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageIndex >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId('void_infraction')
      .setLabel('Void Infraction')
      .setStyle(ButtonStyle.Danger)
  );
}

function updateVoteButtons(interaction, votes) {
  const components = interaction.message.components[0].components.map(button => {
    const updatedButton = ButtonBuilder.from(button);
    if (button.customId === 'vote_up') {
      updatedButton.setLabel(`⬆️ ${votes.up.size}`);
    } else if (button.customId === 'vote_down') {
      updatedButton.setLabel(`⬇️ ${votes.down.size}`);
    }
    return updatedButton;
  });

  return interaction.update({
    components: [new ActionRowBuilder().addComponents(...components)],
  });
}
