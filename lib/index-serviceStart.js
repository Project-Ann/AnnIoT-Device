var Ann     = require("./module/module.js");
var data    = require("./module/data.js");
var figures = require('figures');
var chalk   = require('chalk');
var iot     = new Ann[data.read().deviceType](data.read().id,data.read().mail,data.read().deviceid);
var service = iot.connect(process.title.toString().includes("--debug") ? {debug:true,reconnect:true} : {debug:false,reconnect:true});
console.log("\n" + chalk.green(figures.tick) + " " + chalk.cyan("Service Started\n"))
service
    .once("onSuccess",function(data) {      
            console.log(chalk.green(figures.tick) + chalk.cyan(" Device connected"));
    })

    .on("gpioWrite",function(data) {
        if(process.title.toString().includes("--debug") == true) {
            console.log(chalk.green(figures.tick) + chalk.cyan(` Gpio Write Request ${data.value == 1 ? figures.radioOn + "ON": figures.radioOff + "OFF"} Port: ${data.port}`));
        }
    })