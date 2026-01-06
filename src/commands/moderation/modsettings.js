const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");
const DropChannel = require("../../models/DropChannel");

module.exports = {
  name: "modsettings",
  description: "Configura el canal de drops para mods.",
  deleted: true,
  options: [
    {
      name: "channel",
      description: "El canal donde aparecerán los drops.",
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
  ],
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  callback: async (client, interaction) => {
    const channel = interaction.options.getChannel("channel");
    client.dropChannels.set(interaction.guild.id, channel.id);
    
    try {
      await DropChannel.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { guildId: interaction.guild.id, channelId: channel.id },
        { upsert: true }
      );
    } catch (error) {
      console.error("Error guardando canal de drops:", error);
    }
    
    await interaction.reply(`Canal de drops configurado a ${channel}.`);
  },
};