const { PermissionFlagsBits, ApplicationCommandOptionType, MessageFlags } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Elimina una cantidad específica de mensajes en el canal.',
    testOnly: true,
    permissionsRequired: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages],
    options: [
        {
            name: 'cantidad',
            description: 'Número de mensajes a eliminar (máximo 99).',
            required: true,
            type: ApplicationCommandOptionType.Integer,
            min_value: 1,
            max_value: 99
        }
    ],
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const cantidad = interaction.options.getInteger('cantidad');
        if (!cantidad || cantidad < 1 || cantidad > 99) {
            await interaction.editReply({ content: 'Debes especificar un número entre 1 y 99 <:dumb:1388975790426820809>', flags: MessageFlags.Ephemeral });
            return;
        }

        if (!interaction.channel.permissionsFor(interaction.user).has(PermissionFlagsBits.ManageMessages)) {
            await interaction.editReply({ content: 'No tienes permisos para eliminar mensajes tonto! <:errm:1388975743572381877>', flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            const initialReply = await interaction.editReply({ content: `Eliminando ${cantidad} mensajes... <:done:1388976108665311394>` });
            const initialReplyId = initialReply.id;

            const messages = await interaction.channel.messages.fetch({ limit: cantidad + 1 });
            const now = Date.now();
            const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
            const oldMessages = messages.filter(msg => msg.createdTimestamp < fourteenDaysAgo && msg.id !== initialReplyId).size;

            if (oldMessages > 0) {
                await interaction.editReply({ content: `No se pueden eliminar ${oldMessages}... ` });
                return;
            }

            const messagesToDelete = messages.filter(msg => msg.id !== initialReplyId).first(cantidad);
            const deletedMessages = await interaction.channel.bulkDelete(messagesToDelete, true);

            await interaction.editReply({ content: `Eliminé ${deletedMessages.size} mensajes! <:wow:1388975027864469676>` })
                .catch(err => console.log('No se pudo editar el mensaje de confirmación:', err));
            setTimeout(() => interaction.deleteReply().catch(err => console.log('No se pudo eliminar el mensaje de confirmación:', err)), 3000);
        } catch (error) {
            await interaction.editReply({ content: 'No se pudieron eliminar los mensajes...' })
                .catch(err => console.log('No se pudo enviar el mensaje de error:', err));
        }
    }
};