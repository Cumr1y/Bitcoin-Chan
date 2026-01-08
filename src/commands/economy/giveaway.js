const User = require("../../models/User");
const Giveaway = require("../../models/Giveaway");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");

const TIPOS_PREMIO = ['BTC', 'NITRO', 'STEAM', 'LOL_RP', 'GENSHIN', 'OTRO'];

module.exports = {
    name: "giveaway",
    description: "Crea un sorteo",
    options: [
        {
            name: "tipo",
            description: "Tipo de premio",
            type: 3,
            required: true,
            choices: TIPOS_PREMIO.map(t => ({ name: t, value: t }))
        },
        {
            name: "valor",
            description: "Valor/descripción del premio (ej: '100 BTC', '3 meses Nitro')",
            type: 3,
            required: true,
        },
        {
            name: "costo",
            description: "Costo en BTC para entrar",
            type: 4,
            required: true,
        },
        {
            name: "ganadores",
            description: "Cantidad de ganadores (default: 1, max: 10)",
            type: 4,
            required: false,
        },
        {
            name: "duracion",
            description: "Duración (ej: '2d' para 2 días, '6h' para 6 horas, '30m' para 30 minutos)",
            type: 3,
            required: true,
        },
        {
            name: "descripcion",
            description: "Descripción adicional del premio (opcional)",
            type: 3,
            required: false,
        },
    ],
    callback: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({ content: "Solo en servidores.", flags: MessageFlags.Ephemeral });
        }

        const tipo = interaction.options.getString("tipo");
        const valor = interaction.options.getString("valor");
        const costo = interaction.options.getInteger("costo");
        const duracionStr = interaction.options.getString("duracion");
        const ganadores = Math.min(interaction.options.getInteger("ganadores") || 1, 10);
        const descripcion = interaction.options.getString("descripcion");

        if (costo <= 0) {
            return interaction.reply({ content: "El costo debe ser mayor a 0.", flags: MessageFlags.Ephemeral });
        }

        // Parsear duración
        const duracion = parsearDuracion(duracionStr);
        if (!duracion) {
            return interaction.reply({
                content: "Formato de duración inválido. Usa: '2d', '6h', '30m' (días, horas, minutos)",
                flags: MessageFlags.Ephemeral
            });
        }

        const giveawayId = `${interaction.guild.id}-${Date.now()}`;
        const fechaFin = new Date(Date.now() + duracion);

        // Crear documento en MongoDB
        const newGiveaway = new Giveaway({
            giveawayId,
            guildId: interaction.guild.id,
            creatorId: interaction.user.id,
            premioTipo: tipo,
            premioValor: valor,
            premioDescripcion: descripcion,
            costo,
            ganadores,
            fechaFin,
            channelId: interaction.channel.id,
        });

        await newGiveaway.save();

        // Crear embed
        const embed = new EmbedBuilder()
            .setColor(tipo === 'BTC' ? 0xF7931A : 0x7289DA)
            .setTitle(`🎁 SORTEO - ${tipo}`)
            .addFields(
                { name: "Premio", value: valor, inline: true },
                { name: "Costo", value: `${costo} BTC`, inline: true },
                { name: "Ganadores", value: `${ganadores}`, inline: true },
                { name: "Creador", value: `${interaction.user}`, inline: false },
                { name: "Termina en", value: `<t:${Math.floor(fechaFin.getTime() / 1000)}:R>`, inline: false }
            );

        if (descripcion) {
            embed.addFields({ name: "Descripción", value: descripcion, inline: false });
        }

        embed.setFooter({ text: `Participantes: 0` });

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`giveaway_join_${giveawayId}`)
                .setLabel(`Participar (${costo} BTC)`)
                .setStyle(ButtonStyle.Success)
        );

        const msg = await interaction.reply({ embeds: [embed], components: [button], fetchReply: true });
        
        // Guardar ID del mensaje
        newGiveaway.messageId = msg.id;
        await newGiveaway.save();

        // Auto-finalizar
        setTimeout(() => finalizarSorteo(client, giveawayId), duracion);
    },
};

// Parsear duración (ej: "2d", "6h", "30m")
function parsearDuracion(str) {
    const match = str.match(/^(\d+)([dhm])$/);
    if (!match) return null;

    const valor = parseInt(match[1]);
    const unidad = match[2];

    switch(unidad) {
        case 'd': return valor * 24 * 60 * 60 * 1000; // días
        case 'h': return valor * 60 * 60 * 1000;      // horas
        case 'm': return valor * 60 * 1000;           // minutos
        default: return null;
    }
}

async function finalizarSorteo(client, giveawayId) {
    try {
        const giveaway = await Giveaway.findOne({ giveawayId });
        if (!giveaway || giveaway.estado !== 'activo') return;

        giveaway.estado = 'finalizado';

        if (giveaway.participantes.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle("❌ Sorteo Cancelado")
                .setDescription("No hay participantes.");
            
            try {
                const channel = await client.channels.fetch(giveaway.channelId);
                const msg = await channel.messages.fetch(giveaway.messageId);
                await msg.edit({ embeds: [embed], components: [] });
            } catch (e) {
                console.error("Error editando mensaje:", e);
            }

            await giveaway.save();
            return;
        }

        // Seleccionar ganadores
        const ganadores = [];
        const temp = [...giveaway.participantes];
        
        for (let i = 0; i < giveaway.ganadores && temp.length > 0; i++) {
            const idx = Math.floor(Math.random() * temp.length);
            ganadores.push(temp[idx]);
            temp.splice(idx, 1);
        }

        giveaway.ganadorIds = ganadores;
        await giveaway.save();

        // Crear embed final
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle("🏆 Sorteo Finalizado")
            .addFields(
                { name: "Premio", value: giveaway.premioValor, inline: true },
                { name: "Ganadores", value: ganadores.map(id => `<@${id}>`).join("\n") || "Ninguno", inline: false },
                { name: "Participantes", value: `${giveaway.participantes.length}`, inline: true }
            );

        try {
            const channel = await client.channels.fetch(giveaway.channelId);
            const msg = await channel.messages.fetch(giveaway.messageId);
            await msg.edit({ embeds: [embed], components: [] });
        } catch (e) {
            console.error("Error editando mensaje final:", e);
        }

    } catch (error) {
        console.error("Error finalizando sorteo:", error);
    }
}

