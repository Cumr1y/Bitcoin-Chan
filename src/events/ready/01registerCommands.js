const { testServer } = require("../../../config.json");
const areCommandsDifferent = require("../../utils/areCommandsDifferent");
const getApplicationCommands = require("../../utils/getApplicationCommands");
const getLocalCommands = require("../../utils/getLocalCommands");

module.exports = async (client) => {
  try {
    const localCommands = getLocalCommands();
    
    // Eliminar comandos globales
    const globalCommands = await getApplicationCommands(client);
    for (const globalCommand of globalCommands.cache.values()) {
      await globalCommands.delete(globalCommand.id);
      console.log(`🗑 Comando global eliminado: "${globalCommand.name}".`);
    }
    
    // Registrar comandos en el servidor de prueba (testOnly: true)
    const applicationCommands = await getApplicationCommands(client, testServer);

    for (const localCommand of localCommands) {
      const { name, description, options, dmPermission } = localCommand;

      const existingCommand = await applicationCommands.cache.find(
        (cmd) => cmd.name === name
      );

      if (existingCommand) {
        if (localCommand.deleted) {
          await applicationCommands.delete(existingCommand.id);
          console.log(`🗑 Comando eliminado: "${name}".`);
          continue;
        }

        if (areCommandsDifferent(existingCommand, localCommand)) {
          await applicationCommands.edit(existingCommand.id, {
            description,
            options,
            dm_permission: dmPermission !== false,
          });

          // Silenciar actualizaciones rutinarias
          // console.log(`🔁 Comando actualizado: "${name}".`);
        }
      } else {
        if (localCommand.deleted) {
          continue;
        }

        await applicationCommands.create({
          name,
          description,
          options,
          dm_permission: dmPermission !== false,
        });

        console.log(`👍 Comando registrado: "${name}".`);
      }
    }
  } catch (error) {
    console.log(`Ocurrio un error: ${error}`);
  }
};
