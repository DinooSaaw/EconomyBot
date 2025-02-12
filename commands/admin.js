const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const User = require('../models/User');
const Job = require('../models/Job');
const Shop = require('../models/Shop');
const GuildSettings = require("../models/Settings");

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
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to be assigned for this job (only for create/update)')
                )
                .addIntegerOption(option =>
                    option.setName('tax')
                        .setDescription('Tax amount for this job (only for create/update)')
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
        ),

        // Shop Management Subcommand
        // .addSubcommand(subcommand =>
        //     subcommand.setName('shop')
        //         .setDescription('Manage shops in the economy system.')
        //         .addStringOption(option =>
        //             option.setName('action')
        //                 .setDescription('What do you want to do?')
        //                 .setRequired(true)
        //                 .addChoices(
        //                     { name: 'Create', value: 'create' },
        //                     { name: 'Remove', value: 'remove' },
        //                     { name: 'Update', value: 'update' }
        //                 )
        //         )
        //         .addStringOption(option =>
        //             option.setName('name')
        //                 .setDescription('Shop name (required for create, update, remove)')
        //                 .setRequired(true)
        //         )
        //         .addIntegerOption(option =>
        //             option.setName('maxemployees')
        //                 .setDescription('Maximum number of employees for this shop (only for create/update)')
        //         )
        //         .addIntegerOption(option =>
        //             option.setName('weeklypay')
        //                 .setDescription('Weekly pay for this shop (only for create/update)')
        //         )
        //         .addIntegerOption(option =>
        //             option.setName('governmentpayments')
        //                 .setDescription('Government payments for this shop (only for create/update)')
        //         )
        //         .addIntegerOption(option =>
        //             option.setName('governmenttaxes')
        //                 .setDescription('Government taxes for this shop (only for create/update)')
        //         )
        // ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const action = interaction.options.getString('action');
        
        // Job Management
        if (subcommand === 'job') {
            const name = interaction.options.getString('name');
            const basePay = interaction.options.getInteger('basepay');
            const role = interaction.options.getRole('role');
            const tax = interaction.options.getInteger('tax');
            
            if (action === 'create') {
                await Job.create({ 
                    name, 
                    basePay, 
                    roleId: role?.id || null, 
                    tax: tax || 0 // Default tax to 0 if not provided
                });
                return interaction.reply(`✅ Job **${name}** created with **${basePay}** base pay, role ${role ? role.name : 'None'}, and **${tax || 0}** tax.`);
            }
            
            if (action === 'update') {
                const job = await Job.findOne({ name });
                if (!job) return interaction.reply(`❌ Job **${name}** not found.`);
                
                if (basePay !== null) job.basePay = basePay;
                if (role) job.roleId = role.id;
                if (tax !== null) job.tax = tax;
                await job.save();
                
                return interaction.reply(`✅ Job **${name}** updated with new base pay: **${basePay}**, role: ${role ? role.name : 'None'}, and tax: **${tax || 0}**.`);
            }

            if (action === 'remove') {
                const job = await Job.findOne({ name });
                if (!job) return interaction.reply(`❌ Job **${name}** not found.`);
                await job.deleteOne({ name });
                return interaction.reply(`✅ Job **${name}** removed.`);
            }
        }

        // User Management
        if (subcommand === 'user') {
            const target = interaction.options.getUser('target');
            const action = interaction.options.getString('action');

            if (action === 'set_job') {
                const jobName = interaction.options.getString('job');
                const user = await User.findOne({ _id: target.id });
                if (!user) return interaction.reply(`❌ User **${target.username}** not found.`);
                
                const job = await Job.findOne({ name: jobName });
                if (!job) return interaction.reply(`❌ Job **${jobName}** not found.`);
                
                user.job = job.name;
                await user.save();
                return interaction.reply(`✅ Job for **${target.username}** updated to **${jobName}**.`);
            }

            if (action === 'modify_gold') {
                const amount = interaction.options.getInteger('amount');
                const user = await User.findOne({ _id: target.id });
                if (!user) return interaction.reply(`❌ User **${target.username}** not found.`);
                
                user.gold += amount;
                await user.save();
                return interaction.reply(`✅ Gold for **${target.username}** updated. New balance: **${user.gold}**.`);
            }

            if (action === 'delete') {
                const user = await User.findOne({ _id: target.id });
                if (!user) return interaction.reply(`❌ User **${target.username}** not found.`);
                await user.deleteOne({ _id: target.id });
                return interaction.reply(`✅ User **${target.username}** deleted.`);
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
                    weeklyPay, 
                    governmentPayments, 
                    governmentTaxes
                });
                return interaction.reply(`✅ Shop **${name}** created with **${maxEmployees}** max employees, **${weeklyPay}** weekly pay, government payments: **${governmentPayments}**, and taxes: **${governmentTaxes}**.`);
            }
            
            if (action === 'update') {
                const shop = await Shop.findOne({ name });
                if (!shop) return interaction.reply(`❌ Shop **${name}** not found.`);
                
                if (maxEmployees !== null) shop.maxEmployees = maxEmployees;
                if (weeklyPay !== null) shop.weeklyPay = weeklyPay;
                if (governmentPayments !== null) shop.governmentPayments = governmentPayments;
                if (governmentTaxes !== null) shop.governmentTaxes = governmentTaxes;
                await shop.save();
                
                return interaction.reply(`✅ Shop **${name}** updated.`);
            }

            if (action === 'remove') {
                const shop = await Shop.findOne({ name });
                if (!shop) return interaction.reply(`❌ Shop **${name}** not found.`);
                await shop.deleteOne({name});
                return interaction.reply(`✅ Shop **${name}** removed.`);
            }
        }
    }
};
