const {
    PermissionFlagsBits,
    EmbedBuilder,
    MessageFlags,
    ApplicationCommandOptionType,
} = require("discord.js");
const LevelRole = require("../../models/LevelRole");

module.exports = {
    name: "levelroles",
    description: "Gestiona los roles que se otorgan por nivel",
    deleted: false,
    testOnly: false,
    options: [
        {
            name: "add",
            description: "Añade un rol para un nivel específico",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "level",
                    description: "El nivel requerido",
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                    min_value: 1,
                    max_value: 999
                },
                {
                    name: "rol",
                    description: "El rol a otorgar",
                    type: ApplicationCommandOptionType.Role,
                    required: true
                }
            ]
        },
        {
            name: "remove",
            description: "Remueve el rol de un nivel",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "level",
                    description: "El nivel a remover",
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                    min_value: 1,
                    max_value: 999
                }
            ]
        },
        {
            name: "list",
            description: "Muestra todos los roles configurados por nivel",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "sync",
            description: "Sincroniza todos los usuarios existentes con sus roles de nivel",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    callback: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: "Solo puedes usar este comando en un servidor.",
                flags: MessageFlags.Ephemeral,
            });
        }

        // Verificar permisos
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "❌ No tienes permisos para usar este comando.",
                flags: MessageFlags.Ephemeral,
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        try {
            if (subcommand === "add") {
                const level = interaction.options.getInteger("level");
                const role = interaction.options.getRole("rol");

                // Validar nivel
                if (level < 1 || level > 999) {
                    return interaction.reply({
                        content: "❌ El nivel debe estar entre 1 y 999.",
                        flags: MessageFlags.Ephemeral,
                    });
                }

                // Verificar si ya existe
                const existing = await LevelRole.findOne({
                    guildId,
                    level,
                });

                if (existing) {
                    return interaction.reply({
                        content: `❌ Ya existe un rol para el nivel ${level}.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                // Crear nuevo registro
                const levelRole = new LevelRole({
                    guildId,
                    level,
                    roleId: role.id,
                });

                await levelRole.save();

                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle("✅ Rol Añadido")
                    .setDescription(`El rol ${role} se otorgará al alcanzar nivel **${level}**.`)
                    .setTimestamp();

                return interaction.reply({
                    embeds: [embed],
                });
            } else if (subcommand === "remove") {
                const level = interaction.options.getInteger("level");

                const deleted = await LevelRole.deleteOne({
                    guildId,
                    level,
                });

                if (deleted.deletedCount === 0) {
                    return interaction.reply({
                        content: `❌ No existe un rol configurado para el nivel ${level}.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }

                return interaction.reply({
                    content: `✅ Se removió la configuración del nivel **${level}**.`,
                });
            } else if (subcommand === "list") {
                const levelRoles = await LevelRole.find({ guildId }).sort({
                    level: 1,
                });

                if (levelRoles.length === 0) {
                    return interaction.reply({
                        content: "❌ No hay roles configurados por nivel.",
                        flags: MessageFlags.Ephemeral,
                    });
                }

                const rolesList = levelRoles
                    .map((lr) => `**Nivel ${lr.level}** → <@&${lr.roleId}>`)
                    .join("\n");

                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle("📋 Roles por Nivel")
                    .setDescription(rolesList)
                    .setTimestamp();

                return interaction.reply({
                    embeds: [embed],
                });
            } else if (subcommand === "sync") {
                await interaction.deferReply();

                const Level = require("../../models/Level");
                const allLevelRoles = await LevelRole.find({ guildId }).sort({
                    level: 1,
                });

                if (allLevelRoles.length === 0) {
                    return interaction.editReply({
                        content:
                            "❌ No hay roles configurados. Configura algunos primero con `/levelroles add`.",
                    });
                }

                // Obtener todos los usuarios con niveles en este servidor
                const userLevels = await Level.find({ guildId });

                let processedUsers = 0;
                let successCount = 0;

                for (const userLevel of userLevels) {
                    try {
                        const member = await interaction.guild.members.fetch(
                            userLevel.userId
                        );

                        // Remover todos los roles de nivel
                        for (const lr of allLevelRoles) {
                            try {
                                const role = await interaction.guild.roles.fetch(
                                    lr.roleId
                                );
                                if (role && member.roles.cache.has(role.id)) {
                                    await member.roles.remove(role);
                                }
                            } catch (e) {
                                // Ignorar si el rol no existe
                            }
                        }

                        // Otorgar rol del nivel actual
                        // Buscar el rol más alto que sea <= al nivel del usuario
                        const levelRole = allLevelRoles
                            .filter((lr) => lr.level <= userLevel.level)
                            .sort((a, b) => b.level - a.level)[0];
                        
                        if (levelRole) {
                            const role = await interaction.guild.roles.fetch(
                                levelRole.roleId
                            );
                            if (role) {
                                await member.roles.add(role);
                            }
                        }

                        successCount++;
                    } catch (error) {
                        // Ignorar errores de usuarios que no existen
                    }

                    processedUsers++;
                }

                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle("✅ Sincronización Completada")
                    .setDescription(
                        `Se procesaron **${processedUsers}** usuarios y se actualizaron **${successCount}** roles exitosamente.`
                    )
                    .setTimestamp();

                return interaction.editReply({
                    embeds: [embed],
                });
            }
        } catch (error) {
            console.log(`Error en levelroles: ${error}`);
            return interaction.reply({
                content: "❌ Ocurrió un error al procesar el comando.",
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
