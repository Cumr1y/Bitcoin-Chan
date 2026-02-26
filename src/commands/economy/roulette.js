const User = require("../../models/User");
const { MessageFlags, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "roulette",
    description: "Juega a la ruleta rusa con diferentes dificultades",
    deleted: true,
    options: [
        {
            name: "monto",
            description: "Cantidad de BTC a apostar",
            type: 4,
            required: true,
        },
        {
            name: "dificultad",
            description: "Nivel de dificultad (riesgo vs recompensa)",
            type: 3,
            required: true,
            choices: [
                { name: "🟢 Fácil (75% win, 1.5x)", value: "easy" },
                { name: "🟡 Normal (50% win, 2.5x)", value: "normal" },
                { name: "🔴 Difícil (25% win, 5x)", value: "hard" },
                { name: "⚫ Extremo (10% win, 10x)", value: "extreme" },
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
        const difficulty = interaction.options.getString("dificultad");

        // Validar monto
        if (bet <= 0) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FF0000")
                        .setTitle("❌ Apuesta inválida")
                        .setDescription("Debes apostar una cantidad positiva de BTC.")
                ]
            });
        }

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

        // Configuración por dificultad
        const difficulties = {
            easy: {
                emoji: "🟢",
                name: "Fácil",
                winChance: 0.75,
                multiplier: 1.5,
                bullets: 2,
                chambers: 6,
            },
            normal: {
                emoji: "🟡",
                name: "Normal",
                winChance: 0.5,
                multiplier: 2.5,
                bullets: 3,
                chambers: 6,
            },
            hard: {
                emoji: "🔴",
                name: "Difícil",
                winChance: 0.25,
                multiplier: 5,
                bullets: 4,
                chambers: 6,
            },
            extreme: {
                emoji: "⚫",
                name: "Extremo",
                winChance: 0.1,
                multiplier: 10,
                bullets: 5,
                chambers: 6,
            },
        };

        const diff = difficulties[difficulty];
        const random = Math.random();
        const survived = random < diff.winChance;

        // Calcular ganancias/pérdidas
        let profit = 0;
        let resultEmoji = "";
        let resultText = "";

        if (survived) {
            profit = Math.floor(bet * diff.multiplier) - bet;
            user.balance += Math.floor(bet * diff.multiplier);
            resultEmoji = "💰";
            resultText = "¡¡SOBREVIVISTE!! 🎉";
        } else {
            profit = -bet;
            user.balance -= bet;
            resultEmoji = "💀";
            resultText = "¡¡PERDISTE!! 🔫";
        }

        await user.save();

        // Crear visualización de la ruleta
        const barraJuego = [];
        for (let i = 0; i < diff.chambers; i++) {
            if (i < diff.bullets) {
                barraJuego.push("🔴");
            } else {
                barraJuego.push("⚪");
            }
        }

        const barraAleatoria = barraJuego.sort(() => Math.random() - 0.5).join("");

        // Crear embed
        const embed = new EmbedBuilder()
            .setColor(survived ? "#00FF00" : "#FF0000")
            .setTitle(`🎰 RULETA RUSA - ${diff.emoji} ${diff.name}`)
            .setDescription(`\`\`\`\n[${barraAleatoria}]\n\`\`\``)
            .addFields(
                { name: "Probabilidad de sobrevivir", value: `**${(diff.winChance * 100).toFixed(0)}%**`, inline: true },
                { name: "Multiplicador", value: `**${diff.multiplier.toFixed(1)}x**`, inline: true },
                { name: "\u200B", value: "\u200B", inline: false },
                { name: "Apuesta", value: `**${bet.toLocaleString()} BTC**`, inline: true },
                { name: "Resultado", value: `**${survived ? "+" : ""}${profit.toLocaleString()} BTC**`, inline: true },
                { name: "Estado", value: resultEmoji + " " + resultText, inline: false },
                { name: "Balance actual", value: `**${user.balance.toLocaleString()} BTC**`, inline: false }
            )
            .setFooter({ text: `${interaction.user.username} • ¿Vuelves a intentarlo? /roulette` });

        await interaction.editReply({ embeds: [embed] });
    },
};
