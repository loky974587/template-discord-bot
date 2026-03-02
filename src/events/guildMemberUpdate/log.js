module.exports = {
  name: 'guildMemberUpdate',
  execute(...args) {
    const isDebug = String(process.env.DEBUG).toLowerCase() === 'true' || process.env.DEBUG === '1';
    if (!isDebug) return;
    console.log('[guildMemberUpdate]', ...args);
  }
};
