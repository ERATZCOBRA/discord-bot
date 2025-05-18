const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

require('dotenv').config();

const ALLOWED_ROLE_IDS = process.env.ALLOWED_ROLE_IDS
  ? process.env.ALLOWED_ROLE_IDS.split(',').map(id => id.trim())
  : [];

const INVESTIGATION_LOG_CHANNEL_ID = process.env.INVESTIGATION_LOG_CHANNEL_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log-investigation')
    .setDescription('Log an investigation record to the FBI records.')
    .addStringOption(option =>
      option.setName('agents-involved')
        .setDescription('Names of agents involved (separate with commas)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('suspect-name')
        .setDescription('Suspect’s name or @mention')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('victim-name')
        .setDescription('Victim’s name or type N/A if none')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('scene')
        .setDescription('Type of scene')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('location')
        .setDescription('Location of the scene')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('casualties')
        .setDescription('Casualties (Put N/A if none)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('found-evidence')
        .setDescription('Evidence found at the scene')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('suspect-status')
        .setDescription('Current status of the suspect')
        .addChoices(
          { name: 'Arrested', value: 'Arrested' },
          { name: 'On the run', value: 'On the run' }
        )
        .setRequired(true))
    .addStringOption(option =>
      option.setName('additional-info')
        .setDescription('Additional information (e.g., last seen, vehicle plate, etc.)')
        .setRequired(true))
    .addAttachmentOption(option =>
  option.setName('proof')
    .setDescription('Attach a file as proof (optional)')
    .setRequired(false))

    .setDMPermission(false),

  async execute(interaction, client) {
    const hasAllowedRole = interaction.member.roles.cache.some(role =>
      ALLOWED_ROLE_IDS.includes(role.id)
    );

    if (!hasAllowedRole) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const agentsInvolved = interaction.options.getString('agents-involved');
    const suspectName = interaction.options.getString('suspect-name');
    const victimName = interaction.options.getString('victim-name');
    const scene = interaction.options.getString('scene');
    const location = interaction.options.getString('location');
    const casualties = interaction.options.getString('casualties');
    const evidence = interaction.options.getString('found-evidence');
    const suspectStatus = interaction.options.getString('suspect-status');
    const additionalInfo = interaction.options.getString('additional-info');
    const proofAttachment = interaction.options.getAttachment('proof');
    let proofValue = 'N/A';

    if (proofAttachment) {
      proofValue = `[Attached File](${proofAttachment.url})`;
    }

    const fbiEmoji = '<:FBI:1371728059182485524>';
    const lineSeparator = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

    const author = interaction.user.username;
    const authorAvatarURL = interaction.user.displayAvatarURL({ dynamic: true });
    const time = new Date().toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
      hour12: false
    });

    const embed = new EmbedBuilder()
      .setTitle(`${fbiEmoji} Investigation Log ${fbiEmoji}`)
      .setDescription(
        `${lineSeparator}\n` +
        `> **Agents Involved:** ${agentsInvolved}\n` +
        `> **Suspect's Name:** ${suspectName}\n` +
        `> **Victim's Name:** ${victimName}\n` +
        `> **Scene:** ${scene}\n` +
        `> **Location:** ${location}\n` +
        `> **Casualties:** ${casualties}\n` +
        `> **Found Evidence:** ${evidence}\n` +
        `> **Suspect's Status:** ${suspectStatus}\n` +
        `> **Additional Information:** ${additionalInfo}\n` +
        `> **Proof:** ${proofValue}\n` +
        `${lineSeparator}\n\n` +
        `The following investigation log has been completed and documented after thoroughly reviewing all relevant details and evidence. This log serves as an official record of the incident and the actions taken during the course of the investigation. Further steps, if required, will be based on the findings outlined in this report.\n\n` +
        `**Signed by:** ${interaction.user}`
      )
      .setColor(0x0000ff)
      .setFooter({
        text: `Signed by ${author} | On ${time}`,
        iconURL: authorAvatarURL
      });

    const logChannel = client.channels.cache.get(INVESTIGATION_LOG_CHANNEL_ID);
    if (!logChannel) {
      return interaction.reply({ content: '❌ Log channel not found.', ephemeral: true });
    }

    await logChannel.send({ embeds: [embed] });

    await interaction.reply({
      content: '✅ Investigation log has been successfully posted.',
      ephemeral: true
    });
  }
};
