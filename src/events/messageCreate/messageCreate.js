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

    // Probabilidad fija de 5% por cada mensaje
    const dropChance = 0.05;
    
    if (Math.random() < dropChance) {
        // Drop disparado
        
        let amount;
        if (Math.random() < 0.9) {
            amount = Math.floor(Math.random() * 11) + 10; 
        } else {
            amount = Math.floor(Math.random() * 280) + 21; 
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