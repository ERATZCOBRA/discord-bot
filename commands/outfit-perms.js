require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('outfit-perm')
    .setDescription('Grants a custom outfit permission to an agent.')
    .addUserOption(option =>
      option.setName('agent')
        .setDescription('The agent receiving the permission')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('division')
        .setDescription('Select the division of the agent')
        .setRequired(true)
        .addChoices(
          { name: 'Default', value: 'Default' },
          { name: 'CIRG', value: 'CIRG' },
          { name: 'CI', value: 'CI' },
          { name: 'CID', value: 'CID' },
          { name: 'All', value: 'All' }
        )
    )
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('How long is the permission valid?')
        .setRequired(true)
        .addChoices(
          { name: 'Only this shift', value: 'Only this shift' },
          { name: 'Permanent', value: 'Permanent' }
        )
    )
    .addAttachmentOption(option =>
      option.setName('proof')
        .setDescription('Attach proof of permission')
        .setRequired(true)
    ),

  async execute(interaction) {
    const allowedRoles = [
      process.env.OUTFIT_ACCESS_ROLE_1,
      process.env.OUTFIT_ACCESS_ROLE_2,
    ];

    if (!interaction.member.roles.cache.hasAny(...allowedRoles)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const agent = interaction.options.getUser('agent');
    const division = interaction.options.getString('division');
    const duration = interaction.options.getString('duration');
    const proof = interaction.options.getAttachment('proof');

    const embed = new EmbedBuilder()
      .setTitle('<:FBI_Badge:1192100309137375305> FBI Custom Outfit Permission <:FBI_Badge:1192100309137375305>')
      .setDescription(
        `**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**\n` +
        `Custom outfit permission has been officially granted for the agent within the Federal Bureau of Investigation.\n\n` +
        `This approval allows the agent to wear the designated custom attire in accordance with Bureau guidelines. The privilege is granted based on trust, professionalism, and adherence to uniform standards.\n\n` +
        `**Division:** ${division}\n` +
        `**Duration:** ${duration}\n` +
        `**Custom Outfit Proof:** [Click to view attachment](${proof.url})\n\n` +
        `**Signed by:** ${interaction.user}`
      )
      .setColor(0x0000ff)
      .setImage(proof.url)
      .setTimestamp();

    const logChannel = interaction.client.channels.cache.get(process.env.OUTFIT_LOG_CHANNEL_ID);
    if (!logChannel) {
      return interaction.reply({
        content: '❌ Log channel not found. Please check `OUTFIT_LOG_CHANNEL_ID` in your .env file.',
        ephemeral: true,
      });
    }

    await logChannel.send({ content: `${agent}`, embeds: [embed] });

    try {
      await agent.send({ embeds: [embed] });
    } catch (error) {
      console.warn(`Could not send DM to ${agent.tag}: ${error}`);
    }

    await interaction.reply({
      content: '✅ Custom outfit permission granted, logged, and DM sent successfully.',
      ephemeral: true,
    });
  },
};
