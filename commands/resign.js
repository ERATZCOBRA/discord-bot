require('dotenv').config();
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resign')
    .setDescription('Log a resignation of an agent')
    .addUserOption(option =>
      option.setName('resigned-agent')
        .setDescription('User who has resigned')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('rank')
        .setDescription('Rank of the resigned agent')
        .setRequired(true))
    .setDMPermission(false),         // 👈 Disable in DMs

  async execute(interaction, client) {
    const allowedRoleIds = process.env.RESIGN_ALLOWED_ROLES.split(',');
    const hasPermission = interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));

    if (!hasPermission) {
      return await interaction.reply({
        content: `❌ You do not have permission to use this command.`,
        ephemeral: true,
      });
    }

    const resignedAgent = interaction.options.getUser('resigned-agent');
    const rank = interaction.options.getRole('rank');
    const requester = interaction.user;
    const time = new Date().toLocaleString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const blueLineEmojiId = '1371728240128819250';
    const blueLine = `<:BlueLine:${blueLineEmojiId}>`.repeat(24);

    await interaction.reply({ content: '✅ Resignation has been logged.', ephemeral: true });

    const channelId = process.env.RESIGN_LOG_CHANNEL_ID;
    const channel = await client.channels.fetch(channelId);

    const embed = {
      title: 'ㅤㅤㅤㅤㅤㅤ<:FBI:1371728059182485524>  FBI Resignation  <:FBI:1371728059182485524>ㅤㅤㅤㅤㅤㅤ',
      description:
        `${blueLine}\n` +
        `The Federal Bureau of Investigation acknowledges the resignation of <@${resignedAgent.id}>, holding the rank of ${rank}. Effective immediately. The decision to step down was received and processed in accordance with internal protocol. We thank them for their service and wish them the best in their future endeavors.`,
      color: 0x0000ff,
      footer: {
        text: `Signed by ${requester.username} | On ${time}`,
        iconURL: requester.displayAvatarURL({ dynamic: true }),
      },
    };

    if (channel) {
      await channel.send({
        content: `<@${resignedAgent.id}>`,
        embeds: [embed],
      });
    } else {
      console.log('❌ Resignation log channel not found.');
    }

    try {
      const dmChannel = await resignedAgent.createDM();
      await dmChannel.send({ embeds: [embed] });
    } catch (error) {
      console.log(`❌ Could not send DM to ${resignedAgent.tag}:`, error);
    }
  },
};
