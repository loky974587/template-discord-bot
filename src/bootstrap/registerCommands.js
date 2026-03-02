const { REST, Routes } = require('discord.js');
const { getDiscordConfig, isDebugMode } = require('../config');

async function registerCommands(commands) {
  if (!Array.isArray(commands) || commands.length === 0) return;

  const { token, clientId, guildId } = getDiscordConfig();
  const rest = new REST({ version: '10' }).setToken(token);

  if (isDebugMode() && guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    return;
  }

  await rest.put(Routes.applicationCommands(clientId), { body: commands });
}

module.exports = { registerCommands };
