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
    const targetUserId = interaction.options.get("target").value;
    const reason = interaction.options.get("reason")?.value || "No hay razon";

    await interaction.deferReply();

    // Verificar si el objetivo es un desarrollador
    if (config.devs.includes(targetUserId)) {
      await interaction.editReply("No puedes banear a mi creador tontitx! <:lmao:1388976349233938443>");
      return;
    }

    const targetUser = await interaction.guild.members.fetch(targetUserId);

    if (!targetUser) {
      await interaction.editReply("Este usuario no esta en el server.");
      return;
    }

    if (targetUser.id === interaction.guild.ownerId) {
      await interaction.editReply("No puedo banear al dueño del servidor!");
      return;
    }

    const targetUserRolePosition = targetUser.roles.highest.position;
    const requestUserRolePosition = interaction.member.roles.highest.position;
    const botRolePosition = interaction.guild.members.me.roles.highest.position;

    if (targetUserRolePosition >= requestUserRolePosition) {
      await interaction.editReply("No puedes banear a gente con el mismo o mayor rango que el tuyo, pidele ayuda a alguien de mayor rango!");
      return;
    }

    if (targetUserRolePosition >= botRolePosition) {
      await interaction.editReply("No puedo banear a alguien con mayor rango que el mio, eso estaria encontra de las reglas.");
    }

    try {
      await targetUser.ban({ reason });
      await interaction.editReply(`${targetUser} fue baneado \nReason: ${reason}`);
    } catch (error) {
      console.log(`Hubo un error baneando al usuario: ${error}`);
    }
  },

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  execute: async (message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      message.reply("No tienes permisos para banear usuarios.");
      return;
    }

    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
      message.reply("No tengo permisos para banear usuarios.");
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
      message.reply("A quien voy a banear? <:areusure:1388975645320810557>");
      return;
    }

    // Verificar si el objetivo es un desarrollador
    if (config.devs.includes(targetUser.id)) {
      message.reply("No puedes banear a mi creador tontitx! <:lmao:1388976349233938443>");
      return;
    }

    const targetMember = message.guild.members.cache.get(targetUser.id);
    if (!targetMember) {
      message.reply("Usuario no encontrado en el servidor.");
      return;
    }

    if (targetMember.id === message.guild.ownerId) {
      message.reply("No puedo banear al dueño del servidor.");
      return;
    }

    const targetUserRolePosition = targetMember.roles.highest.position;
    const requestUserRolePosition = message.member.roles.highest.position;
    const botRolePosition = message.guild.members.me.roles.highest.position;

    if (targetUserRolePosition >= requestUserRolePosition) {
      message.reply("No puedes banear a alguien con rol igual o superior.");
      return;
    }

    if (targetUserRolePosition >= botRolePosition) {
      message.reply("No tengo permiso para banear a este usuario.");
      return;
    }

    try {
      await targetMember.ban({ reason });
      message.reply(`${targetUser.tag} fue baneado. Razón: ${reason}`);
    } catch (error) {
      console.error(`Error al banear: ${error}`);
      message.reply("Error al intentar banear.");
    }
  },

  name: "ban",
  description: "Banea un usuario del resver!",
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
  options: [
    {
      name: "target",
      description: "El usuario que se desea banear",
      required: true,
      type: ApplicationCommandOptionType.Mentionable,
    },
    {
      name: "reason",
      description: "La razon por la cual se le esta baneando!",
      type: ApplicationCommandOptionType.String,
    },
  ],
};