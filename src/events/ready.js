module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`[ready] Connecte en tant que ${client.user.tag}`);
  }
};
