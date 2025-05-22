const { SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const ARREST_CHANNEL_ID = process.env.ARREST_LOG_CHANNEL_ID;
const ARREST_ANNOUNCEMENT_CHANNEL_ID = process.env.ARREST_ANNOUNCEMENT_CHANNEL_ID;
const ALLOWED_ROLE_ID = process.env.ARREST_LOG_ROLE_ID;

const HEAVY_UNICODE_LINE_REPEAT = 40;
const UNICODE_LINE = '━'.repeat(HEAVY_UNICODE_LINE_REPEAT);

const FBI_EMOJI = '<:FBI:1371728059182485524>';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log-arrest')
    .setDescription('Log an FBI arrest')
    .addStringOption(opt =>
      opt.setName('arresting_agents')
        .setDescription('Name(s) of primary arresting agent(s)')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('assisting')
        .setDescription('Assisting agents (text or mentions)')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('suspect')
        .setDescription('Suspect\'s name')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('charges')
        .setDescription('Charges')
        .setRequired(true))
    .addAttachmentOption(opt =>
      opt.setName('mugshot')
        .setDescription('Upload a mugshot')
        .setRequired(true)),

  async execute(interaction) {
    const member = interaction.member;
    if (!member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const arresting = interaction.options.getString('arresting_agents');
    const assisting = interaction.options.getString('assisting');
    const suspect = interaction.options.getString('suspect');
    const charges = interaction.options.getString('charges');
    const mugshot = interaction.options.getAttachment('mugshot');

    const embed = {
      color: 0x0000ff,
      description: [
        `**${FBI_EMOJI} 𝗙𝗕𝗜 𝗔𝗥𝗥𝗘𝗦𝗧 𝗟𝗢𝗚 **`.padStart(30 + 15).padEnd(60),
        `${UNICODE_LINE}`,
        `**Primary Agent(s):** ${arresting}`,
        `**Assisting:** ${assisting}`,
        ``,
        `**Suspect's Username:** ${suspect}`,
        ``,
        `**Charges:** ${charges}`,
        ``,
        `**Mugshot:** [Attached Below](${mugshot.url})`,
        ``,
        `**Signed by:** ${interaction.user}`,
      ].join('\n'),
      image: { url: mugshot.url },
      footer: {
        text: `Logged by ${interaction.member.nickname || interaction.user.username} - ${interaction.user.tag}`
      },
    };

    const logChannel = await interaction.client.channels.fetch(ARREST_CHANNEL_ID);
    if (!logChannel || !logChannel.isTextBased()) {
      return interaction.reply({ content: '⚠️ Log channel not found or invalid.', ephemeral: true });
    }

    const message = await logChannel.send({ embeds: [embed] });

    // Try to crosspost if ARREST_ANNOUNCEMENT_CHANNEL_ID is set and matches a news channel
    try {
      const announcementChannel = await interaction.client.channels.fetch(ARREST_ANNOUNCEMENT_CHANNEL_ID);
      if (announcementChannel && announcementChannel.type === 15) { // 15 = GuildAnnouncement
        const announcementMessage = await announcementChannel.send({ embeds: [embed] });
        await announcementMessage.crosspost();
      }
    } catch (error) {
      console.error('❌ Failed to send or crosspost to announcement channel:', error);
    }

    await interaction.reply({ content: '✅ Arrest logged and published successfully.', ephemeral: true });
  }
};
