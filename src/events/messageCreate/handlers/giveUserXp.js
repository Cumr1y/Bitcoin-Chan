const Level = require("../../../models/Level");
const LevelRole = require("../../../models/LevelRole");
const calculateLevelXp = require("../../../utils/calculateLevelXp");
const cooldowns = new Set();

function getRandomXp(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
    if (!message.guild || message.author.bot || cooldowns.has(message.author.id)) return;

    cooldowns.add(message.author.id);

    const xpToGive = getRandomXp(5, 15);

    const query = {
        userId: message.author.id,
        guildId: message.guild.id,
    };

    try {
        let level = await Level.findOne(query);

        if (level) {
            level.xp += xpToGive;

            if (level.xp >= calculateLevelXp(level.level)) {
                level.xp = 0; 
                level.level += 1;

                message.channel.send(`${message.member} ha subido al **nivel ${level.level}**.`);

                // Otorgar rol del nuevo nivel y remover anteriores
                try {
                    // Obtener todos los roles configurados para este servidor
                    const allLevelRoles = await LevelRole.find({
                        guildId: message.guild.id,
                    }).sort({ level: 1 });

                    // Remover todos los roles de nivel
                    for (const lr of allLevelRoles) {
                        try {
                            const role = await message.guild.roles.fetch(lr.roleId);
                            if (role && message.member.roles.cache.has(role.id)) {
                                await message.member.roles.remove(role);
                            }
                        } catch (e) {
                            // Ignorar si el rol no existe
                        }
                    }

                    // Otorgar rol del nivel actual
                    // Buscar el rol exacto para este nivel
                    const levelRole = allLevelRoles.find((lr) => lr.level === level.level);

                    if (levelRole) {
                        const role = await message.guild.roles.fetch(levelRole.roleId);
                        if (role) {
                            await message.member.roles.add(role);
                            message.channel.send(
                                `🎉 ${message.member} ha obtenido el rol ${role}!`
                            );
                        }
                    }
                } catch (roleError) {
                    console.log(`Error al otorgar rol por nivel: ${roleError}`);
                }
            }

            await level.save();
        } else {
            level = new Level({
                userId: message.author.id,
                guildId: message.guild.id,
                xp: xpToGive,
                level: 1,
            });
            await level.save();
        }
    } catch (error) {
        console.log(`Error al dar experiencia: ${error}`);
    }

    setTimeout(() => {
        cooldowns.delete(message.author.id);
    }, 60000);
};
