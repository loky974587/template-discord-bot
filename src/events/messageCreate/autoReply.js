module.exports = {
  async execute(message) {
    if (message.author.bot) return;
    if (message.content.toLowerCase().includes('hello')) {
      await message.reply('Salut !');
    }
  }
};
