const User = require("../../models/User");
const { MessageFlags, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "slots",
    description: "Juega a las máquinas tragaperras con BTC",
    deleted: true,
    options: [
        {
            name: "monto",
            description: "Cantidad de BTC a apostar (10, 50, 100, 500)",
            type: 4,
            required: true,
            choices: [
                { name: "10 BTC", value: 10 },
                { name: "50 BTC", value: 50 },
                { name: "100 BTC", value: 100 },
                { name: "500 BTC", value: 500 },
            ],
        },
    ],
    callback: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({ 
                content: "Solo puedes usar este comando en un servidor.", 
                flags: MessageFlags.Ephemeral 
            });
        }

        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const bet = interaction.options.getInteger("monto");

        // Buscar o crear usuario
        let user = await User.findOne({ userId, guildId });

        if (!user) {
            user = new User({ userId, guildId, balance: 0 });
            await user.save();
        }

        // Verificar si tiene suficientes BTC
        if (user.balance < bet) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FF0000")
                        .setTitle("❌ BTC Insuficientes")
                        .setDescription(`Necesitas **${bet.toLocaleString()} BTC** pero solo tienes **${user.balance.toLocaleString()} BTC**.`)
                        .setFooter({ text: "Usa /daily o /claim para ganar BTC" })
                ]
            });
        }

        // Emojis para slots
        const fruits = ["🍎", "🍌", "🍒", "🍊", "💎", "🎰"];
        
        // Generar 3 resultados
        const result = [
            fruits[Math.floor(Math.random() * fruits.length)],
            fruits[Math.floor(Math.random() * fruits.length)],
            fruits[Math.floor(Math.random() * fruits.length)],
        ];

        // Determinar resultado
        let multiplier = 0;
        let resultText = "";

        if (result[0] === result[1] && result[1] === result[2]) {
            // Triple - Premio grande
            if (result[0] === "💎") {
                multiplier = 10; // 💎 es el jackpot
                resultText = "🎉 ¡¡¡ JACKPOT !!! 💎💎💎";
            } else {
                multiplier = 3;
                resultText = "✨ ¡TRIPLE GANADOR!";
            }
        } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
            // Par - Premio pequeño
            multiplier = 1.5;
            resultText = "🎯 ¡Dos coinciden!";
        } else {
            // Pérdida
            multiplier = 0;
            resultText = "❌ Sin suerte esta vez";
        }

        // Calcular ganancias/pérdidas
        const earned = Math.floor(bet * multiplier);
        const profit = earned - bet;
        
        // Actualizar balance
        if (profit >= 0) {
            user.balance += profit;
        } else {
            user.balance -= bet;
        }

        await user.save();

        // Crear embed
        const embed = new EmbedBuilder()
            .setColor(profit >= 0 ? "#00FF00" : "#FF0000")
            .setTitle("🎰 MÁQUINA TRAGAPERRAS")
            .setDescription(`\`\`\`\n  ${result[0]} | ${result[1]} | ${result[2]}\n\`\`\``)
            .addFields(
                { name: "Apuesta", value: `**${bet.toLocaleString()} BTC**`, inline: true },
                { name: "Ganancia", value: `**${profit >= 0 ? "+" : ""}${profit.toLocaleString()} BTC**`, inline: true },
                { name: "Resultado", value: resultText, inline: false },
                { name: "Balance actual", value: `**${user.balance.toLocaleString()} BTC**`, inline: false }
            )
            .setFooter({ text: `${interaction.user.username} • Usa /slots de nuevo para jugar` });

        await interaction.editReply({ embeds: [embed] });
    },
};
