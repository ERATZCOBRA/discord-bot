const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rate-an-agent')
    .setDescription('Submit a rating and feedback for an agent.')
    .addUserOption(option =>
      option.setName('agent')
        .setDescription('Agent you want to rate')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('rating')
        .setDescription('Rate the agent')
        .setRequired(true)
        .addChoices(
          { name: '1/10', value: '1/10' },
          { name: '2/10', value: '2/10' },
          { name: '3/10', value: '3/10' },
          { name: '4/10', value: '4/10' },
          { name: '5/10', value: '5/10' },
          { name: '6/10', value: '6/10' },
          { name: '7/10', value: '7/10' },
          { name: '8/10', value: '8/10' },
          { name: '9/10', value: '9/10' },
          { name: '10/10', value: '10/10' },
        ))
    .addStringOption(option =>
      option.setName('feedback')
        .setDescription('Your feedback about the agent')
        .setRequired(true)),

  async execute(interaction, client) {
    const agent = interaction.options.getUser('agent');
    const rating = interaction.options.getString('rating');
    const feedback = interaction.options.getString('feedback');

    const fbiEmoji = '<:FBI_Badge:1192100309137375305>';

    const blueLine = '━'.repeat(24);

    const requester = interaction.user;
    const time = new Date().toLocaleString('en-GB', { hour12: false, dateStyle: 'short', timeStyle: 'short' });

    await interaction.reply({ content: '✅ Agent rating submitted.', ephemeral: true });

    const channelId = process.env.RATE_CHANNEL_ID;
    const channel = await client.channels.fetch(channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle(`ㅤㅤㅤㅤㅤ${fbiEmoji}  FBI Agent Rating  ${fbiEmoji}ㅤㅤㅤㅤㅤ`)
      .setDescription(
        `${blueLine}\n` +
        `**Agent:** <@${agent.id}>\n` +
        `**Agent's Rating:** ${rating}\n` +
        `**Feedback:** ${feedback}\n\n` +
        `**Signed,**\n${requester}`
      )
      .setColor(0x0000ff)
      .setFooter({
        text: `Rated by ${requester.username} | On ${time}`,
        iconURL: requester.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    await channel.send({
      content: `<@${agent.id}>`,
      embeds: [embed],
    });
  },
};
