const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
require('dotenv').config();

const awardTypes = {
    [process.env.AGENT_OF_WEEK_ROLE_ID]: 'Agent of the Week',
    [process.env.INSTRUCTOR_OF_WEEK_ROLE_ID]: 'Instructor of the Week',
    [process.env.AGENT_OF_MONTH_ROLE_ID]: 'Agent of the Month',
    [process.env.AGENT_OF_YEAR_ROLE_ID]: 'Agent of the Year',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anc-announce')
        .setDescription('Announce an ANC award.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User receiving the award')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('award')
                .setDescription('Type of award')
                .setRequired(true)
                .addChoices(
                    { name: 'Agent of the Week', value: process.env.AGENT_OF_WEEK_ROLE_ID },
                    { name: 'Instructor of the Week', value: process.env.INSTRUCTOR_OF_WEEK_ROLE_ID },
                    { name: 'Agent of the Month', value: process.env.AGENT_OF_MONTH_ROLE_ID },
                    { name: 'Agent of the Year', value: process.env.AGENT_OF_YEAR_ROLE_ID }
                )),

    async execute(interaction) {
        const accessRoleId = process.env.ANC_ANNOUNCE_ACCESS_ROLE_ID;
        if (!interaction.member.roles.cache.has(accessRoleId)) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('user');
        const awardRoleId = interaction.options.getString('award');
        const awardRoleName = awardTypes[awardRoleId];
        const awardTagRoleId = process.env.AWARD_TAG_ROLE_ID;
        const targetChannelId = process.env.ANC_ANNOUNCE_CHANNEL_ID;

        const unicodeSeparator = '**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**';
        const badgeEmoji = '<:FBI_Badge:1192100309137375305>';
        const requester = interaction.user;
        const timestamp = `<t:${Math.floor(Date.now() / 1000)}:f>`;

        const embed = new EmbedBuilder()
            .setColor(0x0000ff) // Blue
            .setDescription(
                `**　　　　　　　　${badgeEmoji} ${awardRoleName} ${badgeEmoji}　　　　　　　　**\n\n` +
                `${unicodeSeparator}\n\n` +
                `Congratulations to ||<@${user.id}>|| for being recognized as our **${awardRoleName}**! Your unwavering dedication, professionalism, and outstanding contributions have not gone unnoticed. You continue to set a remarkable example for your peers and uphold the highest standards of the Bureau. We thank you for your service and commitment—well deserved! Congratulate them in <#1191435364561334333>.\n\n` +
                `***"The reward for work well done is the opportunity to do more." - Jonas Salk***\n\n` +
                `${unicodeSeparator}\n\n` +
                `Signed by,\n<@1375527393204113670>`
            )
            .setFooter({
                text: `Signed by ${requester.username} • ${timestamp}`,
                iconURL: requester.displayAvatarURL({ dynamic: true }),
            });

        const channel = interaction.client.channels.cache.get(targetChannelId);
        if (!channel || channel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: '❌ Announcement channel is invalid or not found.', ephemeral: true });
        }

        const sentMessage = await channel.send({
            content: `||<@${user.id}>|| ||<@&${awardTagRoleId}>||`,
            embeds: [embed]
        });

        await sentMessage.react('🎉');

        await interaction.reply({ content: '✅ ANC announcement sent and reacted with 🎉!', ephemeral: true });
    }
};
