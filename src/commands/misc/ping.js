module.exports = {
  name: "ping",
  description: "Pong!",
  testOnly: true,
  callback: (client, interaction) => {
    interaction.reply(`Pong! ${client.ws.ping}ms`);
  },
  execute: (client, message, args) => {
    const ping = client?.ws?.ping ?? 'desconocido';
    message.reply(`Pong! ${ping}ms`).catch(console.error);
  },
};