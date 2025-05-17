require('dotenv').config();
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const BLUE_LINE_EMOJI = '<:BlueLine:1372978644770750577>';  // Updated emoji ID
const BLUE_LINE_REPEAT = 24;

// Role IDs from env
const ENTRY_ROLE_ID = process.env.ENTRY_TRAINING_ROLE_ID;
const SNIPER_ROLE_ID = process.env.SNIPER_TRAINING_ROLE_ID;
const GRAPPLER_ROLE_ID = process.env.GRAPPLER_TRAINING_ROLE_ID;

const ENTRY_ACCESS_ROLES = process.env.ENTRY_TRAINING_ACCESS_ROLE_IDS?.split(',') || [];
const SNIPER_ACCESS_ROLES = process.env.SNIPER_TRAINING_ACCESS_ROLE_IDS?.split(',') || [];
const GRAPPLER_ACCESS_ROLES = process.env.GRAPPLER_ACCESS_ROLE_IDS?.split(',') || [];

const TRAINING_CHANNEL_ID = process.env.TRAINING_ANNOUNCE_CHANNEL_ID;

const TRAINING_TYPE_CHOICES = [
  { name: 'Entry Training', value: 'entry' },
  { name: 'Sniper Training', value: 'sniper' },
  { name: 'Grappler Training', value: 'grappler' },
];

const UNIFORM_CHOICES = [
  { name: 'Trainee Uniform', value: 'Trainee Uniform' },
  { name: 'Sniper Trainee Uniform', value: 'Sniper Trainee Uniform' },
];

const GUN_CHOICES = [
  { name: 'Orsis T 5000', value: 'Orsis T 5000' },
  { name: 'Glock17 or FN Five Seven', value: 'Glock1 or FN Five Seven' },
  { name: 'N/A', value: 'N/A' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('host-training')
    .setDescription('Announce an upcoming FBI training')
    .setDefaultMemberPermissions(null)
    .setDMPermission(false)
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Type of training')
        .setRequired(true)
        .addChoices(...TRAINING_TYPE_CHOICES)
    )
    .addStringOption(opt =>
      opt.setName('uniform')
        .setDescription('Uniform for the training')
        .setRequired(true)
        .addChoices(...UNIFORM_CHOICES)
    )
    .addStringOption(opt =>
      opt.setName('gun')
        .setDescription('Gun for the training')
        .setRequired(true)
        .addChoices(...GUN_CHOICES)
    )
    .addUserOption(opt =>
      opt.setName('co-host')
        .setDescription('Co-host of the training (optional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const user = interaction.user;

    const type = interaction.options.getString('type');
    const coHost = interaction.options.getUser('co-host');
    const uniform = interaction.options.getString('uniform');
    const gun = interaction.options.getString('gun');

    let allowedRoles = [];
    if (type === 'entry') allowedRoles = ENTRY_ACCESS_ROLES;
    else if (type === 'sniper') allowedRoles = SNIPER_ACCESS_ROLES;
    else if (type === 'grappler') allowedRoles = GRAPPLER_ACCESS_ROLES;

    const hasAccess = allowedRoles.some(roleId => member.roles.cache.has(roleId));
    if (!hasAccess) {
      return interaction.reply({
        content: `❌ You do not have permission to host **${type.charAt(0).toUpperCase() + type.slice(1)} Training**.`,
        ephemeral: true,
      });
    }

    let pingRoleId;
    let trainingLabel;

    if (type === 'entry') {
      pingRoleId = ENTRY_ROLE_ID;
      trainingLabel = 'Entry Training';
    } else if (type === 'sniper') {
      pingRoleId = SNIPER_ROLE_ID;
      trainingLabel = 'Sniper Training';
    } else if (type === 'grappler') {
      pingRoleId = GRAPPLER_ROLE_ID;
      trainingLabel = 'Grappler Training';
    }

    if (!pingRoleId) {
      return interaction.reply({
        content: '❌ Training ping role is not configured properly.',
        ephemeral: true,
      });
    }

    const blueLine = BLUE_LINE_EMOJI.repeat(BLUE_LINE_REPEAT);
    const coHostText = coHost ? coHost.toString() : 'None';

    const embed = new EmbedBuilder()
      .setTitle(`ㅤㅤㅤ<:FBISeal:1372972550782451874>  FBI Training  <:FBISeal:1372972550782451874>ㅤㅤㅤ`)
      .setDescription(
        `${blueLine}\n\n` +
        `FBI **${trainingLabel}** will be beginning in a few minutes. Join up!\n\n` +
        `> **Host:** ${user}\n` +
        `> **Co-host:** ${coHostText}\n` +
        `> **Server Code:** FBIAcademy\n` +
        `> **Uniform:** ${uniform}\n` +
        `> **Gun:** ${gun}\n\n` +
        `React if joining`
      )
      .setColor(0x0000ff);

    try {
      const guild = interaction.guild;
      if (!guild) {
        return interaction.reply({
          content: '❌ This command can only be used in a server.',
          ephemeral: true,
        });
      }

      const targetChannel = guild.channels.cache.get(TRAINING_CHANNEL_ID);
      if (!targetChannel || !targetChannel.isTextBased()) {
        return interaction.reply({
          content: '❌ The training announcement channel is not found or is not a text channel.',
          ephemeral: true,
        });
      }

      const message = await targetChannel.send({
        content: `<@&${pingRoleId}>`,
        embeds: [embed],
      });

      await message.react('✅');

      await message.startThread({
        name: `${trainingLabel} - Hosted by ${user.username}`,
        autoArchiveDuration: 60,
        reason: 'Training session announcement thread',
      });

      await interaction.reply({
        content: `✅ Training announcement sent successfully in ${targetChannel}.`,
        ephemeral: true,
      });

    } catch (error) {
      console.error('Error sending host-training message:', error);
      await interaction.reply({
        content: '❌ Failed to send training announcement.',
        ephemeral: true,
      });
    }
  },
};
