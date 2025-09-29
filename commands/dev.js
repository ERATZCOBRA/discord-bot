const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dev")
        .setDescription("Send a suggestion or feedback to the developer."),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("Developer Contact")
            .setDescription("Please choose any of the following option provided below.");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("dev_suggestion")
                .setLabel("Suggestions")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("dev_feedback")
                .setLabel("Feedback")
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true,
        });
    },
};
