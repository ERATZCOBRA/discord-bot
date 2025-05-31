const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

// Env-based role and channel config
const CHANNEL_ID = process.env.MEDAL_REQUEST_CHANNEL_ID;
const ROLE_ID_1 = process.env.MEDAL_REVIEW_ROLE_ID_1;
const ROLE_ID_2 = process.env.MEDAL_REVIEW_ROLE_ID_2;

// Styling constants
const FBI_EMOJI = '<:FBI_Badge:1192100309137375305>';
const BLUELINE = '━'.repeat(24);  // <-- Changed here

// Invisible padding for center alignment
const INVISIBLE = '\u200b'.repeat(15);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('request-medal')
    .setDescription('Request an FBI Medal')
    .addStringOption(opt =>
      opt.setName('medal')
        .setDescription('Select the medal')
        .setRequired(true)
        .addChoices(
          { name: 'Veteran', value: 'Veteran' },
          { name: 'Medal of Leadership', value: 'Medal of Leadership' },
          { name: 'FBI Bronze Service Medal', value: 'FBI Bronze Service Medal' },
          { name: 'FBI Silver Service Medal', value: 'FBI Silver Service Medal' },
          { name: 'FBI Gold Service Medal', value: 'FBI Gold Service Medal' },
          { name: 'Medal of Supreme Field Merit', value: 'Medal of Supreme Field Merit' }
        )
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for the medal request')
        .setRequired(true)
    )
    .addAttachmentOption(opt =>
      opt.setName('proof1')
        .setDescription('Optional proof attachment')
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
      opt.setName('proof2')
        .setDescription('Additional proof attachment')
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
      opt.setName('proof3')
        .setDescription('Additional proof attachment')
        .setRequired(false)
    ),

  async execute(interaction) {
    const medal = interaction.options.getString('medal');
    const reason = interaction.options.getString('reason');
    const proof1 = interaction.options.getAttachment('proof1');
    const proof2 = interaction.options.getAttachment('proof2');
    const proof3 = interaction.options.getAttachment('proof3');

    const proofAttachments = [proof1, proof2, proof3].filter(Boolean);

    const embed = new EmbedBuilder()
      .setColor(0x0000ff)
      .setDescription([
        `${INVISIBLE}**${FBI_EMOJI} 𝗠𝗘𝗗𝗔𝗟 𝗥𝗘𝗤𝗨𝗘𝗦𝗧 ${FBI_EMOJI}**`,
        `${BLUELINE}`,
        `I would like to formally request consideration for the awarding of medals in recognition of my contributions and service within the Federal Bureau of Investigation. I believe my efforts and achievements meet the criteria outlined for medal eligibility. I kindly ask for your review and approval of this request.`,
        ``,
        `**Username:** ${interaction.user}`,
        `**Medal:** ${medal}`,
        `**Reason:** ${reason}`,
        `**Proof:** ${proofAttachments.length > 0 ? 'Attached' : 'N/A'}`,
      ].join('\n'))
      .setFooter({
        text: `${interaction.member?.nickname || interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    const channel = await interaction.client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      return interaction.reply({ content: '⚠️ Medal request channel is invalid.', ephemeral: true });
    }

    const messagePayload = {
      content: `<@&${ROLE_ID_1}> <@&${ROLE_ID_2}>`,
      embeds: [embed],
    };

    if (proofAttachments.length > 0) {
      messagePayload.files = proofAttachments.map(att => new AttachmentBuilder(att.url));
    }

    await channel.send(messagePayload);
    await interaction.reply({ content: '✅ Your medal request has been submitted for review.', ephemeral: true });
  }
};
