require('dotenv').config();
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType
} = require('discord.js');

const BLUE_LINE = '<:BlueLine:1294034867230736425>'.repeat(24);

const MENTION_ROLE_IDS = process.env.MENTION_ROLE_IDS?.split(',').map(id => id.trim()) || [];
const COMMAND_ACCESS_ROLE_ID = process.env.COMMAND_ACCESS_ROLE_ID;
const BUTTON_ACCESS_ROLE_IDS = process.env.BUTTON_ACCESS_ROLE_IDS?.split(',').map(id => id.trim()) || [];
const CALLSIGN_REQUEST_CHANNEL_ID = process.env.CALLSIGN_REQUEST_CHANNEL_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('callsign-request')
    .setDescription('Request a new callsign')
    .addRoleOption(option =>
      option.setName('rank')
        .setDescription('Rank of the user')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('callsign')
        .setDescription('Requested callsign')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for requesting the callsign')
        .setRequired(true)),

  async execute(interaction) {
    const hasCommandAccess = interaction.member.roles.cache.has(COMMAND_ACCESS_ROLE_ID);
    if (!hasCommandAccess) {
      return interaction.reply({
        content: '❌ You do not have the required role to use this command.',
        ephemeral: true,
      });
    }

    const rank = interaction.options.getRole('rank');
    const callsign = interaction.options.getString('callsign');
    const reason = interaction.options.getString('reason');
    const requester = interaction.user;

    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
    });
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false, hour: '2-digit', minute: '2-digit'
    });

    const embed = new EmbedBuilder()
      .setTitle('ㅤㅤㅤㅤㅤㅤ<:FBI_Badge:1192100309137375305>  FBI Callsign Request  <:FBI_Badge:1192100309137375305>ㅤㅤㅤㅤㅤㅤ')
      .setDescription(
        `${BLUE_LINE}\nA new callsign has been requested.\n\n` +
        `**Requested by:** ${requester}\n` +
        `**Rank:** ${rank}\n` +
        `**Requested Callsign:** \`${callsign}\`\n` +
        `**Reason:** ${reason}`
      )
      .setColor(0x0000ff)
      .setFooter({
        text: `Signed by ${requester.username} • ${date} • Time: ${time}`,
        iconURL: requester.displayAvatarURL({ dynamic: true, size: 1024 })
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept')
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('deny')
        .setLabel('Deny')
        .setStyle(ButtonStyle.Danger)
    );

    let channel;
    try {
      channel = await interaction.client.channels.fetch(CALLSIGN_REQUEST_CHANNEL_ID);
    } catch (error) {
      console.error('Error fetching callsign request channel:', error);
      return interaction.reply({
        content: '❌ Failed to fetch the callsign request channel. Please check the channel ID.',
        ephemeral: true,
      });
    }

    if (!channel) {
      return interaction.reply({
        content: '❌ Could not find the callsign request channel. Please check the channel ID.',
        ephemeral: true,
      });
    }

    const mentionRoles = MENTION_ROLE_IDS.map(id => `<@&${id}>`).join(' ');

    const message = await channel.send({
      content: mentionRoles,
      embeds: [embed],
      components: [row],
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 600_000,
      filter: i =>
        ['accept', 'deny'].includes(i.customId) &&
        BUTTON_ACCESS_ROLE_IDS.some(roleId => i.member.roles.cache.has(roleId))
    });

    collector.on('collect', async i => {
      const isAccept = i.customId === 'accept';
      const status = isAccept ? '✅ Accepted' : '❌ Denied';
      const reviewer = i.user;

      const decisionDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
      });
      const decisionTime = new Date().toLocaleTimeString('en-US', {
        hour12: false, hour: '2-digit', minute: '2-digit'
      });

      embed
        .setColor(isAccept ? 0x00FF00 : 0xFF0000)
        .addFields({ name: 'Status', value: `${status} by ${reviewer}` })
        .setFooter({
          text: `Decision by ${reviewer.username} • ${decisionDate} • Time: ${decisionTime}`,
          iconURL: reviewer.displayAvatarURL({ dynamic: true, size: 1024 }),
        });

      await i.update({
        embeds: [embed],
        components: [],
      });

      collector.stop();
    });

    await interaction.reply({
      content: '✅ Callsign request has been submitted.',
      ephemeral: true,
    });
  },
};
