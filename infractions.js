require('dotenv').config();
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../infractionDatabase'); // Adjust path if needed

const PAGE_SIZE = 5;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infractions')
    .setDescription('View infractions for a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to view infractions for')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const allowedRoleIds = process.env.INFRACTIONS_ALLOWED_ROLE_IDS
      ? process.env.INFRACTIONS_ALLOWED_ROLE_IDS.split(',').map(id => id.trim())
      : [];

    if (!interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id))) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('user');

    db.all(
      'SELECT * FROM infractions WHERE user_id = ? ORDER BY timestamp DESC',
      [targetUser.id],
      async (err, rows) => {
        if (err) {
          console.error(err);
          return interaction.reply({
            content: '❌ Error fetching infractions from the database.',
            ephemeral: true,
          });
        }

        if (!rows.length) {
          return interaction.reply({
            content: `ℹ️ No infractions found for ${targetUser.tag}.`,
            ephemeral: true,
          });
        }

        // Chunk infractions into pages
        const pages = [];
        for (let i = 0; i < rows.length; i += PAGE_SIZE) {
          pages.push(rows.slice(i, i + PAGE_SIZE));
        }

        // Helper to create embed for a page
        async function createEmbed(pageIndex) {
          const page = pages[pageIndex];

          // Build fields for current page infractions
          const fields = await Promise.all(
            page.map(async infraction => {
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
            .setTitle(`Infractions for ${targetUser.tag} (Page ${pageIndex + 1}/${pages.length})`)
            .addFields(fields)
            .setColor(0xff0000)
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();
        }

        // Helper to create navigation buttons (Previous, Next) + Void Infraction button
        function createButtons(pageIndex) {
          return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`infractions_prev_${targetUser.id}_${pageIndex}`)
              .setLabel('Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(pageIndex === 0),
            new ButtonBuilder()
              .setCustomId(`infractions_next_${targetUser.id}_${pageIndex}`)
              .setLabel('Next')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(pageIndex === pages.length - 1),
            new ButtonBuilder()
              .setCustomId('void_infraction')
              .setLabel('Void Infraction')
              .setStyle(ButtonStyle.Danger)
          );
        }

        // Send first page
        const currentPage = 0;
        const embed = await createEmbed(currentPage);
        const buttons = createButtons(currentPage);

        await interaction.reply({
          embeds: [embed],
          components: [buttons],
          ephemeral: true,
        });
      }
    );
  },
};
