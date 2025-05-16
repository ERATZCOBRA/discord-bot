require('dotenv').config();
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');

const BLUE_LINE = '<:BlueLine:1371728240128819250>'.repeat(24);

// Updated environment keys
const ROLE_IDS = {
  entry: {
    mention: process.env.REQ_ENTRY_ROLE_ID,
    access: process.env.REQ_ENTRY_ACCESS_ROLE_IDS
      ? process.env.REQ_ENTRY_ACCESS_ROLE_IDS.split(',').map(id => id.trim())
      : [],
    label: 'Entry Training',
  },
  sniper: {
    mention: process.env.REQ_SNIPER_ROLE_ID,
    access: process.env.REQ_SNIPER_ACCESS_ROLE_IDS
      ? process.env.REQ_SNIPER_ACCESS_ROLE_IDS.split(',').map(id => id.trim())
      : [],
    label: 'Sniper Training',
  },
  grappler: {
    mention: process.env.REQ_GRAPPLER_ROLE_ID,
    access: process.env.REQ_GRAPPLER_ACCESS_ROLE_IDS
      ? process.env.REQ_GRAPPLER_ACCESS_ROLE_IDS.split(',').map(id => id.trim())
      : [],
    label: 'Grappler Training',
  },
};

const TARGET_CHANNEL_ID = process.env.TRAINING_REQUEST_CHANNEL_ID;
const REVIEWER_ROLE_IDS = process.env.TRAINING_REVIEWER_ROLE_IDS
  ? process.env.TRAINING_REVIEWER_ROLE_IDS.split(',').map(id => id.trim())
  : [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('request-training')
    .setDescription('Submit a formal FBI training request')
    .setDefaultMemberPermissions(0n)
    .setDMPermission(false)
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of training')
        .setRequired(true)
        .addChoices(
          { name: 'Entry Training', value: 'entry' },
          { name: 'Sniper Training', value: 'sniper' },
          { name: 'Grappler Training', value: 'grappler' }
        )
    )
    .addStringOption(option =>
      option.setName('available-time')
        .setDescription('Your available time for training')
        .setRequired(true)
    ),

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const availableTime = interaction.options.getString('available-time');
    const user = interaction.user;
    const member = interaction.member;

    const training = ROLE_IDS[type];
    if (!training) {
      return interaction.reply({
        content: '❌ Invalid training type selected.',
        ephemeral: true,
      });
    }

    const hasAccess = training.access.some(roleId => member.roles.cache.has(roleId));
    if (!hasAccess) {
      return interaction.reply({
        content: '❌ You do not have permission to request this type of training.',
        ephemeral: true,
      });
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    const embed = new EmbedBuilder()
      .setTitle('ㅤㅤㅤ<:FBI:1371728059182485524>  FBI Training Request  <:FBI:1371728059182485524>ㅤㅤㅤ')
      .setDescription(
        `${BLUE_LINE}\n\n` +
        `I hereby submit a formal request to participate in the upcoming training program within the Federal Bureau of Investigation. I am eager to enhance my skills and knowledge to better serve the agency's mission.\n\n` +
        `> **Trainee:** ${user}\n` +
        `> **Type of Training:** ${training.label}\n` +
        `> **Available Time:** ${availableTime}\n` +
        `> **Status:** ⏳ Pending`
      )
      .setColor(0x0000ff)
      .setFooter({
        text: `Signed by, ${user.username} • Time: ${formattedTime}`,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept_training')
        .setLabel('✅ Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('deny_training')
        .setLabel('❌ Deny')
        .setStyle(ButtonStyle.Danger)
    );

    try {
      const targetChannel = await interaction.client.channels.fetch(TARGET_CHANNEL_ID);
      if (!targetChannel) {
        return interaction.reply({
          content: '❌ Could not find the training request channel.',
          ephemeral: true,
        });
      }

      const message = await targetChannel.send({
        content: `<@&${training.mention}>`,
        embeds: [embed],
        components: [buttons],
      });

      await message.startThread({
        name: `${training.label} - ${user.username}`,
        autoArchiveDuration: 60,
        reason: 'Training request thread created',
      });

      await interaction.reply({
        content: '✅ Your training request has been submitted successfully.',
        ephemeral: true,
      });

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      collector.on('collect', async i => {
        const isReviewer = REVIEWER_ROLE_IDS.some(roleId => i.member.roles.cache.has(roleId));
        if (!isReviewer) {
          return i.reply({
            content: '❌ You do not have permission to review training requests.',
            ephemeral: true,
          });
        }

        const decision = i.customId === 'accept_training' ? '✅ Accepted' : '❌ Denied';
        const color = i.customId === 'accept_training' ? 0x00ff00 : 0xff0000;

        const updatedEmbed = EmbedBuilder.from(message.embeds[0])
          .setColor(color)
          .setDescription(
            message.embeds[0].description.replace(
              /> \*\*Status:\*\* .*/,
              `> **Status:** ${decision} by ${i.user}`
            )
          );

        await message.edit({ embeds: [updatedEmbed], components: [] });
        await i.reply({ content: `Training request has been ${decision.toLowerCase()}.`, ephemeral: true });
        collector.stop();
      });

    } catch (error) {
      console.error('Error while processing training request:', error);
      await interaction.reply({
        content: '❌ An unexpected error occurred while submitting your request.',
        ephemeral: true,
      });
    }
  },
};
