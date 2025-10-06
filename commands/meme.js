const prefix = "-"; // 👈 Change your prefix here
const pingUserId = "1230381143879323698"; // 👈 Replace with the user ID to ping
const imageUrl = "https://cdn.discordapp.com/attachments/1199760706434760865/1424796704858701965/RobloxScreenShot20251006_213041823.png?ex=68e540d5&is=68e3ef55&hm=770c5b01796a9400a5bc06c1964f57841aa53451274c36e7eb6d2e08ba01129d&"; // 👈 Replace with your image URL

module.exports = {
  name: "tobi",
  description: "Send an image pinging a specific user.",
  
  async execute(message, args) {
    try {
      // Only trigger if the message starts with the prefix + command name
      if (!message.content.startsWith(prefix + "tobi")) return;

      // Send the image + ping
      await message.channel.send({
        content: `<@${pingUserId}>`,
        files: [imageUrl],
      });
    } catch (err) {
      console.error("❌ Error executing tobi command:", err);
      await message.reply("Something went wrong while sending the image.");
    }
  },
};
