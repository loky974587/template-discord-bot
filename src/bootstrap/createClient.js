const { Client } = require('discord.js');
const { DEFAULT_INTENTS } = require('../config');

function createClient() {
  return new Client({ intents: DEFAULT_INTENTS });
}

module.exports = { createClient };
