#! /usr/bin/env node

/*
    All rights reserved to Project Ann®, AnnIoT™ is trademark of Project Ann
    2018-2019
*/

const restify  = require('restify-clients');
const sleep    = require('system-sleep');
const program  = require('commander');
const prompts  = require('prompts');

const updateNotifier = require('update-notifier');
const pkg      = require('../package.json');
const boxen    = require('boxen');

const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000
})

if (notifier.update) {
    console.log(chalk.blue(figures.info) + ` Update available: ` + chalk.red(pkg.version) + " " + chalk.cyan(figures.arrowRight) + " " + chalk.green(notifier.update.latest));
    return;
}

var uid = process.env.SUDO_UID;

if(uid == undefined) {
    console.log(boxen(chalk.red(figures.cross) + " Process not started as sudo try to add $sudo to begining of command", {padding: 1}));
    return;
}

program
  .version(pkg.version)
  .option('--debug', 'Debug mode')
  .command("login","Login to your device")
  .command("serviceStart","Start IoT service")
  .command("signOut","Sign out in this device")
  .parse(process.argv);
  

    var allOptions = ["--debug"];
    var allCommands  = ["signOut","serviceStart","login"];
    
    if(process.argv[2] == undefined) {
        program.help();
    } else if((process.argv[2] !== undefined && process.argv[3] == undefined) && !allCommands.includes(process.argv[2])) {
        program.help();
    } else if(process.argv[3] !== undefined && (!allOptions.includes(process.argv[2]) || !allCommands.includes(process.argv[3]))) {
        program.help();
    }   