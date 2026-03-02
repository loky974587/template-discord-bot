module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error('[interactionCreate] error', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Une erreur est survenue.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
      }
    }
  }
};
