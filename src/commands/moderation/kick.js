const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");
const config = require("../../../config.json");

module.exports = {
  testOnly: true,
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const targetUserId = interaction.options.get("target-user").value;
    const reason = interaction.options.get("reason")?.value || "No hay razon";

    await interaction.deferReply();

    // Verificar si el objetivo es un desarrollador
    if (config.devs.includes(targetUserId)) {
      await interaction.editReply("No puedes echar a mi creador tontitx! <:teehee:1388976349233938443>");
      return;
    }

    const targetUser = await interaction.guild.members.fetch(targetUserId);

    if (!targetUser) {
      await interaction.editReply("Este usuario no esta en el server.");
      return;
    }

    if (targetUser.id === interaction.guild.ownerId) {
      await interaction.editReply("No puedo kickear a mi creador tontitx!");
      return;
    }

    const targetUserRolePosition = targetUser.roles.highest.position;
    const requestUserRolePosition = interaction.member.roles.highest.position;
    const botRolePosition = interaction.guild.members.me.roles.highest.position;

    if (targetUserRolePosition >= requestUserRolePosition) {
      await interaction.editReply("No puedes kickear a gente con el mismo o mayor rango que el tuyo, pidele ayuda a alguien de mayor rango!");
      return;
    }

    if (targetUserRolePosition >= botRolePosition) {
      await interaction.editReply("No puedo kickear a alguien con mayor rango que el mio, eso estaria encontra de las reglas.");
    }

    try {
      await targetUser.kick({ reason });
      await interaction.editReply(`El usuario ${targetUser} fue kickeado \nReason: ${reason}`);
    } catch (error) {
      console.log(`Hubo un error kickeando al usuario: ${error}`);
    }
  },

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  execute: async (message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      message.reply("No tienes permisos para kickear usuarios.");
      return;
    }

    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
      message.reply("No tengo permisos para kickear usuarios.");
      return;
    }

    let targetUser;
    const reason = args.join(" ") || "No hay razon";

    // Si se responde a un mensaje, usa al autor del mensaje respondido
    if (message.reference) {
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
      targetUser = repliedMessage.author;
    } else if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
    } else if (args.length > 0) {
      targetUser = await message.guild.members.fetch(args[0]).then(m => m.user).catch(() => null);
    } else {
      message.reply("A quien voy a echar? <:areusure:1388975645320810557>");
      return;
    }

    // Verificar si el objetivo es un desarrollador
    if (config.devs.includes(targetUser.id)) {
      message.reply("No puedes echar a mi creador tontitx! <:teehee:1388976349233938443>");
      return;
    }

    const targetMember = message.guild.members.cache.get(targetUser.id);
    if (!targetMember) {
      message.reply("Usuario no encontrado en el servidor.");
      return;
    }

    if (targetMember.id === message.guild.ownerId) {
      message.reply("No puedo kickear al dueño del servidor.");
      return;
    }

    const targetUserRolePosition = targetMember.roles.highest.position;
    const requestUserRolePosition = message.member.roles.highest.position;
    const botRolePosition = message.guild.members.me.roles.highest.position;

    if (targetUserRolePosition >= requestUserRolePosition) {
      message.reply("No puedes kickear a alguien con rol igual o superior.");
      return;
    }

    if (targetUserRolePosition >= botRolePosition) {
      message.reply("No tengo permiso para kickear a este usuario.");
      return;
    }

    try {
      await targetMember.kick({ reason });
      message.reply(`El usuario ${targetUser.tag} fue kickeado. Razón: ${reason}`);
    } catch (error) {
      console.error(`Error al kickear: ${error}`);
      message.reply("Error al intentar kickear.");
    }
  },

  name: "kick",
  description: "Kickea un usuario del resver!",
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
  options: [
    {
      name: "target-user",
      description: "El usuario que se desea kickear",
      required: true,
      type: ApplicationCommandOptionType.Mentionable,
    },
    {
      name: "reason",
      description: "La razon por la cual se le esta kickeando!",
      type: ApplicationCommandOptionType.String,
    },
  ],
};