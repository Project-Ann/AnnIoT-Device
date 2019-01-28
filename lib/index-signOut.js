const data     = require("./module/data")
const figures  = require('figures');
const chalk    = require('chalk');
try {
    if(!data.check())  {
    console.log(chalk.red(figures.cross) + chalk.cyan(" Signout Failed. Cant find data")) 
    return;
    }
    data.delete()
    console.log(chalk.green(figures.tick) + chalk.cyan(" Successfully signed out"))
} catch(err) {
    console.log(chalk.red(figures.cross) + chalk.cyan(" Signing out failed \n\n") + chalk.cyan(figures.pointer) + " " + err.message)
}

