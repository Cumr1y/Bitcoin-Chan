const { devs, testServer } = require("../../../config.json");
const getLocalCommands = require("../../utils/getLocalCommands");
const { MessageFlags } = require("discord.js");

module.exports = async (client, interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const localCommands = getLocalCommands();

  try {
    const commandObject = localCommands.find(
      (cmd) => cmd.name === interaction.commandName
    );

    if (!commandObject) return;

    if (commandObject.devOnly) {
      if (!devs.includes(interaction.user.id)) {
        interaction.reply({
          content: "Solo los creadores pueden usar este comando.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    if (commandObject.testOnly) {
      if (!interaction.guild || interaction.guild.id !== testServer) {
        interaction.reply({
          content: "Este comando no se puede usar aqui.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    if (commandObject.permissionsRequired?.length) {
      if (!interaction.guild || !interaction.member) {
        interaction.reply({
          content: "Este comando solo funciona en servidores.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      for (const permission of commandObject.permissionsRequired) {
        if (!interaction.member.permissions.has(permission)) {
          interaction.reply({
            content: "No hay permisos suficientes.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }
    }

    if (commandObject.botPermissions?.length) {
      if (!interaction.guild) {
        interaction.reply({
          content: "Este comando solo funciona en servidores.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const bot = interaction.guild.members.me;

      if (!bot.permissions.has(commandObject.botPermissions)) {
        interaction.reply({
          content: "No tengo suficientes permisos.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    if (typeof commandObject.callback === 'function') {
      await commandObject.callback(client, interaction);
    } else {
      console.log(`Command ${commandObject.name} has no callback for interactions.`);
      return;
    }
  } catch (error) {
    console.log(`Hubo un error al correr el comando: ${error}`);
  }
};
