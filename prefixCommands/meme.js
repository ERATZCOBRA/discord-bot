const prefix = "-"; // 👈 Easily change your prefix here
const pingUserId = "1230381143879323698"; // 👈 User ID to ping
const imageUrl = "https://cdn.discordapp.com/attachments/1199760706434760865/1424796704858701965/RobloxScreenShot20251006_213041823.png"; // 👈 Image URL

module.exports = {
  name: "tobi",
  description: "Send an image pinging a specific user.",

  async execute(message, args) {
    try {
      // ✅ Only trigger for the correct prefix
      if (!message.content.toLowerCase().startsWith(`${prefix}tobi`)) return;

      // ✅ Delete the user's command message (so it disappears)
      await message.delete().catch(() => {});

      // ✅ Send the ping + embedded image (shows inline, not as a file)
      await message.channel.send({
        content: `<@${pingUserId}>`,
        embeds: [
          {
            image: { url: imageUrl },
            color: 0x2b2d31, // Optional: dark Discord gray
          },
        ],
      });
    } catch (err) {
      console.error("❌ Error executing tobi command:", err);
      await message.reply("⚠️ Something went wrong while sending the image.").catch(() => {});
    }
  },
};
