const fs = require('node:fs/promises');
const path = require('node:path');
const { Collection } = require('discord.js');

async function getCommandFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await getCommandFiles(fullPath);
      files.push(...nested);
      continue;
    }
    if (path.extname(entry.name) === '.js') {
      files.push(fullPath);
    }
  }

  return files;
}

async function loadCommands(commandsDir, client) {
  const files = await getCommandFiles(commandsDir);
  const commands = [];

  client.commands = new Collection();

  for (const filePath of files) {
    const command = require(filePath);
    if (!command?.data?.toJSON || typeof command.execute !== 'function') continue;

    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }

  return commands;
}

module.exports = { loadCommands };
