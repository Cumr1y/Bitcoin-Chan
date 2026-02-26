const setupRPC = require("../../handlers/rpcHandler");
const DropChannel = require("../../models/DropChannel");

module.exports = async (client) => {
  try {
    console.log(`> ${client.user.username}#${client.user.discriminator} está online en ${client.guilds.cache.size} servidores!`);

    // Configurar el RPC con rotación después de un pequeño retraso
    setTimeout(() => {
      setupRPC(client);
    }, 1000);

    // Cargar los canales de drop de la base de datos
    const dropChannels = await DropChannel.find();
    dropChannels.forEach(doc => {
      client.dropChannels.set(doc.guildId, doc.channelId);
    });
  } catch (error) {
    console.log(`Ocurrio un error en ready event: ${error}`);
  }
};
