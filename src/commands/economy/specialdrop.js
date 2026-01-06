const { EmbedBuilder, MessageFlags } = require('discord.js');
const { deleted } = require('../moderation/updatejoins');

const DEVELOPER_ID = '735634543318532147'; // Curly

module.exports = {
    name: 'specialdrop',
    description: 'Genera un drop especial de BTC (Solo Developer)',
    testOnly: true,
    deleted: true,
    options: [
        {
            name: 'channel',
            description: 'Canal donde aparecera el drop especial',
            type: 7, // CHANNEL type
            required: true
        }
    ],
    callback: async (client, interaction) => {
        // Verificar que solo el Developer pueda usar este comando
        if (interaction.user.id !== DEVELOPER_ID) {
            return interaction.reply({
                content: '❌ Este comando solo puede usarlo el Developer.',
                flags: MessageFlags.Ephemeral
            });
        }

        const targetChannel = interaction.options.getChannel('channel');

        // Verificar que el bot tenga permisos en el canal
        if (!targetChannel.permissionsFor(client.user).has('SendMessages')) {
            return interaction.reply({
                content: '❌ No tengo permisos para enviar mensajes en ese canal.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Generar cantidad especial (200-750)
        const amount = Math.floor(Math.random() * 551) + 200;

        // Crear embed especial destacado
        const specialEmbed = new EmbedBuilder()
            .setTitle('🌟 ✨ DROP ESPECIAL ✨ 🌟')
            .setDescription(`¡¡¡UN DROP LEGENDARIO HA APARECIDO!!!\n\n**CANTIDAD EPICA:** ${amount} BTC\n\nEscribe \`/claim\` para reclamarlo si eres lo suficientemente rapido.`)
            .setColor(0xFF6B00) // Color naranja brillante
            .setImage('https://tenor.com/view/happy-new-year2021-anime-gif-19775977') // GIF epico
            .setTimestamp()
            .setFooter({ text: '⚡ ESPECIAL ⚡' });

        try {
            const dropMessage = await targetChannel.send({ embeds: [specialEmbed] });

            // Registrar el drop en activeDrops
            client.activeDrops.set(targetChannel.id, {
                messageId: dropMessage.id,
                message: dropMessage,
                amount,
                claimed: false,
                claimer: null
            });

            // Timeout de 120 segundos (2 minutos) para drops especiales
            setTimeout(() => {
                const drop = client.activeDrops.get(targetChannel.id);
                if (drop && !drop.claimed) {
                    drop.claimed = true;
                    client.activeDrops.delete(targetChannel.id);
                }
            }, 120000);

            interaction.reply({
                content: `✅ Drop especial de **${amount} BTC** lanzado en ${targetChannel}`,
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error('Error en specialdrop:', error);
            interaction.reply({
                content: '❌ Error al crear el drop especial.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
