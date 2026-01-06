const User = require("../../models/User");
const Level = require("../../models/Level");
const { EmbedBuilder, MessageFlags, AttachmentBuilder } = require("discord.js");
const canvas = require("canvas");
const axios = require("axios");

module.exports = {
    name: "profile",
    description: "Muestra tu perfil o el de otro usuario.",
    testOnly: true,
    options: [
        {
            name: "usuario",
            description: "El usuario cuyo perfil quieres ver (opcional)",
            type: 9, // USER type
            required: false,
        },
    ],
    callback: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: "Solo puedes usar este comando en un servidor.",
                flags: MessageFlags.Ephemeral,
            });
        }

        await interaction.deferReply();

        const targetUserId = interaction.options.getUser("usuario")?.id || interaction.user.id;
        const targetUser = await interaction.guild.members.fetch(targetUserId);

        if (!targetUser) {
            return interaction.editReply({
                content: "No se encontró ese usuario en el servidor.",
            });
        }

        // Verificar si es un bot
        if (targetUser.user.bot) {
            await interaction.editReply({
                content: "❌ No puedes ver el perfil de un bot.",
            });
            const replyMsg = await interaction.fetchReply();
            setTimeout(() => replyMsg.delete().catch(console.error), 5000);
            return;
        }

        // Obtener datos del usuario
        let user = await User.findOne({ userId: targetUserId, guildId: interaction.guild.id });
        if (!user) {
            user = new User({ userId: targetUserId, guildId: interaction.guild.id });
            await user.save();
        }

        // Obtener nivel del usuario
        let levelData = await Level.findOne({ userId: targetUserId, guildId: interaction.guild.id });
        if (!levelData) {
            levelData = { level: 0, xp: 0 };
        }

        // Calcular tiempo desde que se unió
        const joinedDate = user.joinedAt || targetUser.joinedAt;
        const now = new Date();
        const diffTime = Math.abs(now - joinedDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let timeText = "";
        if (diffDays === 0) {
            timeText = "Hoy";
        } else if (diffDays === 1) {
            timeText = "Hace 1 día";
        } else if (diffDays < 30) {
            timeText = `Hace ${diffDays} días`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            timeText = `Hace ${months} ${months === 1 ? "mes" : "meses"}`;
        } else {
            const years = Math.floor(diffDays / 365);
            timeText = `Hace ${years} ${years === 1 ? "año" : "años"}`;
        }

        // Barra de progreso de XP
        const xpPerLevel = 100;
        const maxXp = xpPerLevel * (levelData.level + 1);
        const progress = Math.floor((levelData.xp / maxXp) * 10);
        const progressBar = "█".repeat(progress) + "░".repeat(10 - progress);

        // Obtener roles del usuario (sin el @everyone)
        const roles = targetUser.roles.cache
            .filter(role => role.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .slice(0, 5);
        const rolesText = roles.length > 0 ? roles.join(", ") : "Sin roles";

        // Obtener información de actividad
        const totalXp = (levelData.level * 100) + levelData.xp;

        // Crear imagen del perfil
        const profileCanvas = canvas.createCanvas(800, 600);
        const ctx = profileCanvas.getContext("2d");

        // Fondo degradado Negro
        const gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, "#1a1a1a");
        gradient.addColorStop(1, "#0d0d0d");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);

        // Borde superior decorativo
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 800, 5);

        // Cargar avatar del usuario
        try {
            const avatarURL = targetUser.user.displayAvatarURL({ extension: "png", size: 512 });
            const avatarImage = await canvas.loadImage(avatarURL);
            
            // Dibujar círculo para el avatar
            ctx.save();
            ctx.beginPath();
            ctx.arc(100, 100, 80, 0, Math.PI * 2);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.clip();
            ctx.drawImage(avatarImage, 20, 20, 160, 160);
            ctx.restore();
        } catch (error) {
            console.error("Error al cargar el avatar:", error);
        }

        // Nombre de usuario
        ctx.font = "bold 48px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(targetUser.user.username, 220, 90);

        // Tag del servidor
        ctx.font = "22px Arial";
        ctx.fillStyle = "#cccccc";
        ctx.fillText(`@${targetUser.user.username}`, 220, 125);

        // Línea divisoria
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, 200);
        ctx.lineTo(770, 200);
        ctx.stroke();

        // Sección de estadísticas
        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#ffffff";

        // Fila 1: Balance y Nivel
        ctx.fillText("💰 Balance", 50, 250);
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "#e0e0e0";
        ctx.fillText(`${user.balance.toLocaleString()} BTC`, 50, 285);

        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("📊 Nivel", 350, 250);
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "#e0e0e0";
        ctx.fillText(`${levelData.level}`, 350, 285);

        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("⭐ XP Total", 600, 250);
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "#e0e0e0";
        ctx.fillText(`${totalXp.toLocaleString()}`, 600, 285);

        // Fila 2: XP actual y fecha
        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("✨ XP Actual", 50, 340);
        ctx.font = "bold 26px Arial";
        ctx.fillStyle = "#e0e0e0";
        ctx.fillText(`${levelData.xp}/${maxXp}`, 50, 375);

        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("📅 Se unió", 350, 340);
        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#cccccc";
        ctx.fillText(joinedDate.toLocaleDateString("es-ES"), 350, 375);

        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("⏰ Tiempo", 600, 340);
        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#cccccc";
        ctx.fillText(timeText, 600, 375);

        // Pie de página
        ctx.font = "14px Arial";
        ctx.fillStyle = "#999999";
        ctx.fillText(`ID: ${targetUserId} • Perfil generado en ${new Date().toLocaleTimeString("es-ES")}`, 50, 570);

        // Convertir canvas a buffer
        const buffer = profileCanvas.toBuffer("image/png");
        const attachment = new AttachmentBuilder(buffer, { name: "profile.png" });

        return interaction.editReply({ files: [attachment] });
    },
};
