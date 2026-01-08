const { EmbedBuilder } = require('discord.js');
const getLocalCommands = require('../../utils/getLocalCommands');
const giveUserXp = require('./handlers/giveUserXp');

module.exports = async (client, message) => {
    if (message.author.bot) return;

    await giveUserXp(client, message);

    // Drops   
    const dropChannel = client.dropChannels.get(message.guild.id);
    if (!dropChannel || message.channel.id !== dropChannel) return;

    if (client.activeDrops.has(message.channel.id)) return;

    // Probabilidad: 0.5% por cada mensaje (muy raro)
    const dropChance = 0.005;
    
    if (Math.random() < dropChance) {
        // Drop disparado - Mucho más valioso
        
        let amount;
        if (Math.random() < 0.85) {
            // 85% de chance: Drop normal pero más valioso (100-500 BTC)
            amount = Math.floor(Math.random() * 400) + 100;
        } else {
            // 15% de chance: Drop raro (500-2000 BTC)
            amount = Math.floor(Math.random() * 1500) + 500;
        }

        const embed = new EmbedBuilder()
            .setTitle("💰 Drop de BTC!")
            .setDescription("Un drop de BTC ha aparecido! Escribe `/claim` para reclamarlo.")
            .setColor(0x008000)
            .setImage('https://c.tenor.com/IAd79sYP2JIAAAAC/tenor.gif') // GIF para el drop
            .setTimestamp();

        try {
            const dropMessage = await message.channel.send({ embeds: [embed] });
            client.activeDrops.set(message.channel.id, {
                messageId: dropMessage.id,
                message: dropMessage,
                amount,
                claimed: false,
                claimer: null
            });

            setTimeout(async () => {
                const drop = client.activeDrops.get(message.channel.id);
                if (drop && !drop.claimed) {
                    drop.claimed = true;
                    client.activeDrops.delete(message.channel.id);
                    
                    try {
                        await dropMessage.edit({ 
                            embeds: [new EmbedBuilder()
                                .setTitle("💰 Drop Expirado")
                                .setDescription("El drop de BTC ha expirado sin ser reclamado.")
                                .setColor(0xff0000)
                                .setTimestamp()] 
                        });
                        
                        setTimeout(async () => {
                            try {
                                await dropMessage.delete();
                            } catch (error) {
                                if (error.code !== 10008) {
                                    console.error("Error eliminando mensaje:", error);
                                }
                            }
                        }, 30000);
                    } catch (error) {
                        if (error.code !== 10008) {
                            console.error("Error editando mensaje:", error);
                        }
                    }
                }
            }, 30 * 1000); // 30 segundos
        } catch (error) {
            console.error("Error enviando drop:", error);
        }
    }
};