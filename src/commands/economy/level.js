const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  AttachmentBuilder,
} = require('discord.js');
const canvacord = require('canvacord');
const calculateLevelXp = require('../../utils/calculateLevelXp');
const Level = require('../../models/Level');

module.exports = {
  testOnly: true,
  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
      interaction.reply('Solo puedes correr este comando en un server.');
      return;
    }

    await interaction.deferReply();

    const mentionedUserId = interaction.options.get('target')?.value;
    const targetUserId = mentionedUserId || interaction.member.id;
    const targetUserObj = await interaction.guild.members.fetch(targetUserId);

    const fetchedLevel = await Level.findOne({
      userId: targetUserId,
      guildId: interaction.guild.id,
    });

    if (!fetchedLevel) {
      interaction.editReply(
        mentionedUserId
          ? `<@${targetUserId}> no ha ganado experiencia aún.`
          : "No tienes niveles aún, habla un poco más e inténtalo de nuevo."
      );
      return;
    }

    let allLevels = await Level.find({ guildId: interaction.guild.id }).select(
      '-_id userId level xp'
    );

    allLevels.sort((a, b) => {
      if (a.level === b.level) {
        return b.xp - a.xp;
      } else {
        return b.level - a.level;
      }
    });
    let currentRank = allLevels.findIndex((lvl) => lvl.userId === targetUserId) + 1;

    const rank = new canvacord.Rank()
      .setAvatar(targetUserObj.user.displayAvatarURL({ size: 256 }))
      .setRank(currentRank)
      .setLevel(fetchedLevel.level)
      .setCurrentXP(fetchedLevel.xp)
      .setRequiredXP(calculateLevelXp(fetchedLevel.level))
      .setStatus(targetUserObj.presence?.status ?? "offline")
      .setProgressBar(["#FFFFFF", "#E0E0E0"], "GRADIENT")
      .setUsername(targetUserObj.user.displayName)
      .setBackground("COLOR", "#000000");

    const data = await rank.build();
    const attachment = new AttachmentBuilder(data);
    
    interaction.editReply({ files: [attachment] });
  },

  execute: async (client, message, args) => {
    if (!message.guild) {
      message.channel.send("Este comando solo funciona en un servidor.");
      return;
    }

    let targetUserId;
    if (message.reference) {
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
      targetUserId = repliedMessage.author.id;
    } else {
      targetUserId = message.author.id;
      if (args.length > 0) {
        const target = message.mentions.users.first() || await message.guild.members.fetch(args[0]).then(m => m.user).catch(() => null);
        if (target) targetUserId = target.id;
      }
    }

    const targetUser = await message.guild.members.fetch(targetUserId);
    const fetchedLevel = await Level.findOne({
      userId: targetUserId,
      guildId: message.guild.id,
    });

    if (!fetchedLevel) {
      message.channel.send(
        targetUserId === message.author.id
          ? "No tienes niveles aún, habla un poco más e inténtalo de nuevo."
          : `<@${targetUserId}> no ha ganado experiencia aún.`
      );
      return;
    }

    let allLevels = await Level.find({ guildId: message.guild.id }).select(
      '-_id userId level xp'
    );

    allLevels.sort((a, b) => {
      if (a.level === b.level) {
        return b.xp - a.xp;
      } else {
        return b.level - a.level;
      }
    });
    let currentRank = allLevels.findIndex((lvl) => lvl.userId === targetUserId) + 1;

    const rank = new canvacord.Rank()
      .setAvatar(targetUser.user.displayAvatarURL({ size: 256 }))
      .setRank(currentRank)
      .setLevel(fetchedLevel.level)
      .setCurrentXP(fetchedLevel.xp)
      .setRequiredXP(calculateLevelXp(fetchedLevel.level))
      .setStatus(targetUser.presence?.status ?? "offline")
      .setProgressBar(["#FFFFFF", "#E0E0E0"], "GRADIENT")
      .setUsername(targetUser.user.displayName)
      .setBackground("COLOR", "#000000");

    const data = await rank.build();
    const attachment = new AttachmentBuilder(data, { name: 'level.png' });
    
    message.channel.send({ files: [attachment] });
  },

  name: 'level',
  description: "Muestra tu nivel o el de alguien más.",
  options: [
    {
      name: 'target',
      description: 'El usuario del que quieres ver el nivel.',
      type: ApplicationCommandOptionType.Mentionable,
    },
  ],
};