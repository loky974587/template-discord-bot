const { GatewayIntentBits } = require('discord.js');

const DEFAULT_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
];

function loadEnv() {
  if (!process.env.TOKEN || !process.env.CLIENT_ID) {
    throw new Error('Missing TOKEN or CLIENT_ID in .env');
  }
}

function getDiscordConfig() {
  return {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID || null
  };
}

function isDebugMode() {
  return String(process.env.DEBUG).toLowerCase() === 'true' || process.env.DEBUG === '1';
}

module.exports = {
  DEFAULT_INTENTS,
  loadEnv,
  getDiscordConfig,
  isDebugMode
};
