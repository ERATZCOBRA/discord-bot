const prefix = "-"; // 👈 Easily change your prefix here
const pingUserId = "1230381143879323698"; // 👈 User ID to ping
const imageUrl = "https://cdn.discordapp.com/attachments/1199760706434760865/1424796704858701965/RobloxScreenShot20251006_213041823.png"; // 👈 Image URL

module.exports = {
  name: "tobi",
  description: "Send an image pinging a specific user.",

  async execute(message, args) {
    try {
      // ✅ Only trigger for the right prefix and command
      if (!message.content.toLowerCase().startsWith(`${prefix}tobi`)) return;

      // ✅ Send ping + image
      await message.channel.send({
        content: `<@${pingUserId}>`,
        files: [imageUrl],
      });
    } catch (err) {
      console.error("❌ Error executing tobi command:", err);
      await message.reply("⚠️ Something went wrong while sending the image.");
    }
  },
};
