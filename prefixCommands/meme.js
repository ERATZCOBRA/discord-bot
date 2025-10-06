const prefix = "-";
const pingUserId = "1230381143879323698";
const imageUrl = "https://cdn.discordapp.com/attachments/1290682040840093787/1424806282753343488/RobloxScreenShot20251006_213041823.png?ex=68e549c1&is=68e3f841&hm=b3f4ffeed6ab9b1947a17df4f01200d4d5c67f456be6dab3b03e54f9d48cdfdc&";

const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "tobi",
  description: "Send an image pinging a specific user.",

  async execute(message, args) {
    try {
      if (!message.content.toLowerCase().startsWith(`${prefix}tobi`)) return;

      const embed = new EmbedBuilder()
        .setImage(imageUrl)
        .setColor("#2b2d31") // nice neutral color
        .setFooter({ text: "Requested by " + message.author.username, iconURL: message.author.displayAvatarURL() });

      await message.channel.send({
        content: `<@${pingUserId}>`,
        embeds: [embed],
      });
    } catch (err) {
      console.error("❌ Error executing tobi command:", err);
      await message.reply("⚠️ Something went wrong while sending the image.");
    }
  },
};
