const Level = require("../../../models/Level");
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
