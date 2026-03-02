const path = require('node:path');
const { loadEnv } = require('../config');
const { createClient } = require('./createClient');
const { loadCommands } = require('./loadCommands');
const { loadEvents } = require('./loadEvents');
const { registerCommands } = require('./registerCommands');

async function startBot() {
  loadEnv();

  const client = createClient();
  const commandsDir = path.join(__dirname, '..', 'commands');
  const eventsDir = path.join(__dirname, '..', 'events');

  const commands = await loadCommands(commandsDir, client);
  await loadEvents(eventsDir, client);
  await registerCommands(commands);

  await client.login(process.env.TOKEN);
}

module.exports = { startBot };
