const fs = require('node:fs/promises');
const path = require('node:path');

async function getEventFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await getEventFiles(fullPath);
      files.push(...nested);
      continue;
    }
    if (path.extname(entry.name) === '.js') {
      files.push(fullPath);
    }
  }

  return files;
}

function inferEventName(filePath, baseDir) {
  const relative = path.relative(baseDir, filePath);
  const segments = relative.split(path.sep).filter(Boolean);
  if (segments.length === 0) return null;

  if (segments.length === 1) {
    return path.parse(segments[0]).name;
  }

  return segments[0];
}

async function loadEvents(eventsDir, client) {
  const files = await getEventFiles(eventsDir);

  for (const filePath of files) {
    const event = require(filePath);
    if (!event || typeof event.execute !== 'function') continue;

    const eventName = event.name || event.event || inferEventName(filePath, eventsDir);
    if (!eventName) continue;

    if (event.once) {
      client.once(eventName, (...args) => event.execute(...args, client));
    } else {
      client.on(eventName, (...args) => event.execute(...args, client));
    }
  }
}

module.exports = { loadEvents };
