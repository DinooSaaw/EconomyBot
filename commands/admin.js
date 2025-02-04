const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const User = require('../Models/User');
const Job = require('../Models/Job');
const Shop = require('../models/Shop');

const ALLOWED_USER_IDS = ['', '']; // Replace with authorized user IDs
const ALLOWED_ROLE_IDS = ['739331042552578180', '']; // Replace with authorized role IDs

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin commands for managing the systems within the economy system.')
        
        // Job Management Subcommand
        .addSubcommand(subcommand =>
            subcommand.setName('job')
                .setDescription('Manage jobs in the economy system.')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('What do you want to do?')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Create', value: 'create' },
                            { name: 'Remove', value: 'remove' },
                            { name: 'Update', value: 'update' }
                        )
                )
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Job name (required for create, update, remove)') 
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('basepay')
                        .setDescription('Base salary for this job (only for create/update)')
                )
        )
        
        // User Management Subcommand
        .addSubcommand(subcommand =>
            subcommand.setName('user')
                .setDescription('Manage users in the economy system.')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('What do you want to do?')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Set Job', value: 'set_job' },
                            { name: 'Modify Gold', value: 'modify_gold' },
                            { name: 'Delete User', value: 'delete' }
                        )
                )
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('User to modify.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('job')
                        .setDescription('New job name (only for set_job)')
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Gold amount (only for modify_gold)')
                )
        )

        // Shop Management Subcommand
        .addSubcommand(subcommand =>
            subcommand.setName('shop')
                .setDescription('Manage shops in the economy system.')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('What do you want to do?')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Create', value: 'create' },
                            { name: 'Remove', value: 'remove' },
                            { name: 'Update', value: 'update' }
                        )
                )
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Shop name (required for create, update, remove)')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('maxemployees')
                        .setDescription('Maximum number of employees for this shop (only for create/update)')
                )
                .addIntegerOption(option =>
                    option.setName('weeklypay')
                        .setDescription('Weekly pay for this shop (only for create/update)')
                )
                .addIntegerOption(option =>
                    option.setName('governmentpayments')
                        .setDescription('Government payments for this shop (only for create/update)')
                )
                .addIntegerOption(option =>
                    option.setName('governmenttaxes')
                        .setDescription('Government taxes for this shop (only for create/update)')
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const action = interaction.options.getString('action');

        // Embed response function
        const createEmbed = (title, description, color = '#00FF00') => {
            return new EmbedBuilder()
                .setColor(color)
                .setTitle(title)
                .setDescription(description)
                .setFooter({ text: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() });
        };

        // Check if user has "Admin" role or is an administrator
        const member = interaction.guild.members.cache.get(interaction.user.id);
        const isAdmin = member && (ALLOWED_USER_IDS.includes(interaction.user.id) || member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id)))

        if (!isAdmin) {
            return interaction.reply({
                embeds: [createEmbed('❌ Unauthorized', 'You do not have the required permissions to perform this action.', '#FF0000')],
                ephemeral: true
            });
        }

        // Job Management
        if (subcommand === 'job') {
            const name = interaction.options.getString('name');
            const basePay = interaction.options.getInteger('basepay');

            if (action === 'create') {
                if (!basePay) {
                    return interaction.reply({
                        embeds: [createEmbed('❌ Job Creation Failed', 'You must provide a base salary!', '#FF0000')],
                        ephemeral: true
                    });
                }

                await Job.create({ name, basePay });

                return interaction.reply({
                    embeds: [createEmbed('✅ Job Created', `Job **${name}** created with **${basePay}** base pay.`)]
                });
            }

            if (action === 'update') {
                const job = await Job.findOne({ name });
                if (!job) return interaction.reply({ embeds: [createEmbed('❌ Job Not Found', 'No job with that name exists!', '#FF0000')] });

                if (basePay !== null) job.basePay = basePay;
                await job.save();

                return interaction.reply({
                    embeds: [createEmbed('✅ Job Updated', `Job **${name}** updated successfully.`)]
                });
            }

            if (action === 'remove') {
                const job = await Job.findOneAndDelete({ name });
                if (!job) return interaction.reply({ embeds: [createEmbed('❌ Job Not Found', 'No job with that name exists!', '#FF0000')] });
                return interaction.reply({
                    embeds: [createEmbed('🗑️ Job Deleted', `Job **${name}** has been deleted from the system.`)]
                });
            }
        }

        // User Management
        if (subcommand === 'user') {
            const targetUser = interaction.options.getUser('target');
            let user = await User.findOne({ _id: targetUser.id });

            if (action === 'set_job') {
                const jobName = interaction.options.getString('job');
                const job = await Job.findOne({ name: jobName });
                if (!job) return interaction.reply({ embeds: [createEmbed('❌ Job Not Found', 'The job you want to assign does not exist!', '#FF0000')] });

                if (!user) user = await User.create({ _id: targetUser.id, job: jobName, gold: 0 });
                else {
                    user.job = jobName;
                    await user.save();
                }

                return interaction.reply({
                    embeds: [createEmbed('✅ Job Set', `${targetUser.username} is now a **${jobName}**.`)]
                });
            }

            if (action === 'modify_gold') {
                const amount = interaction.options.getInteger('amount');
                if (!user) return interaction.reply({ embeds: [createEmbed('❌ User Not Found', 'User not found in database!', '#FF0000')] });

                user.gold += amount;
                await user.save();

                return interaction.reply({
                    embeds: [createEmbed('💰 Gold Modified', `Updated **${targetUser.username}**'s balance by **${amount}** gold. New balance: **${user.gold}**.`)]
                });
            }

            if (action === 'delete') {
                await User.findOneAndDelete({ _id: targetUser.id });
                return interaction.reply({
                    embeds: [createEmbed('🗑️ User Deleted', `${targetUser.username} has been deleted from the database.`)]
                });
            }
        }

        // Shop Management
        if (subcommand === 'shop') {
            const name = interaction.options.getString('name');
            const maxEmployees = interaction.options.getInteger('maxemployees');
            const weeklyPay = interaction.options.getInteger('weeklypay');
            const governmentPayments = interaction.options.getInteger('governmentpayments');
            const governmentTaxes = interaction.options.getInteger('governmenttaxes');

            if (action === 'create') {
                await Shop.create({ 
                    name, 
                    maxEmployees, 
                    employees: [], // Start with no employees
                    weeklyPay, 
                    governmentPayments, 
                    governmentTaxes 
                });

                return interaction.reply({
                    embeds: [createEmbed('✅ Shop Created', `Shop **${name}** created with **${maxEmployees}** max employees.`)]
                });
            }

            if (action === 'update') {
                const shop = await Shop.findOne({ name });
                if (!shop) return interaction.reply({ embeds: [createEmbed('❌ Shop Not Found', 'No shop with that name exists!', '#FF0000')] });

                if (maxEmployees !== null) shop.maxEmployees = maxEmployees;
                if (weeklyPay !== null) shop.weeklyPay = weeklyPay;
                if (governmentPayments !== null) shop.governmentPayments = governmentPayments;
                if (governmentTaxes !== null) shop.governmentTaxes = governmentTaxes;

                await shop.save();

                return interaction.reply({
                    embeds: [createEmbed('✅ Shop Updated', `Shop **${name}** updated successfully.`)]
                });
            }

            if (action === 'remove') {
                const shop = await Shop.findOneAndDelete({ name });
                if (!shop) return interaction.reply({ embeds: [createEmbed('❌ Shop Not Found', 'No shop with that name exists!', '#FF0000')] });
                return interaction.reply({
                    embeds: [createEmbed('🗑️ Shop Deleted', `Shop **${name}** has been deleted from the system.`)]
                });
            }
        }
    }
};
