module.exports = {
  async execute(message) {
    if (message.author.bot) return;
    console.log(`[message] ${message.author.tag}: ${message.content}`);
  }
};
