const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express'); // Added express

dotenv.config();

const client = new Client({
@@ -44,9 +46,20 @@ for (const file of eventFiles) {
}
}

// Bot is ready, but no need to register commands here (since deploy-commands.js does it)
// Express server to keep Render happy and bot alive
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});

client.once('ready', async () => {
console.log('✅ Bot is ready!');
});

client.login(process.env.TOKEN);
client.login(process.env.TOKEN);
