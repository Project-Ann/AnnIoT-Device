#! /usr/bin/env node

/*
    All rights reserved to Project Ann®, AnnIoT™ is trademark of Project Ann
    2018-2019
*/

const restify  = require('restify-clients');
const sleep    = require('system-sleep');
const program  = require('commander');
const prompts  = require('prompts');
const crypto   = require("crypto");
const updateNotifier = require('update-notifier');
const pkg      = require('../package.json');
const boxen    = require('boxen');
const chalk    = require("chalk");
const figures  = require("figures");
const ora      = require('ora');
const data     = require("./module/data");

var server     = "https://www.projectann.xyz";


const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000
})

if (notifier.update) {
    console.log(chalk.blue(figures.info) + ` Update available: ` + chalk.red(pkg.version) + " " + chalk.cyan(figures.arrowRight) + " " + chalk.green(notifier.update.latest));
}

var uid = process.env.SUDO_UID;

if(uid == undefined) {
    console.log(boxen(chalk.red(figures.cross) + " Process not started as sudo try to add $sudo to begining of command", {padding: 1}));
    return;
}

program.version(pkg.version)
program.option('--debug', 'Debug mode')
program.command("login")
  .description("Login to your device")
  .action(function () {  
    var dtCh = "";
    
    try {
        dtCh = data.check();
    } catch(err) {
        console.log(chalk.red(figures.cross) + chalk.cyan(" Cannot read data file. Are you sudo ? \n\n Try delete " + require('os').homedir() + "/iotConfig.data"));
        console.log(chalk.cyan(figures.pointer + " " + err.message))
        process.exit();
    }
    
    let questions = [
      {
          type: 'text',
          name: 'mail',
          message: 'What is your mail adress ?'
      },
      {
          type: 'password',
          name: 'id',
          message: 'Account id ?'
      }
    ];
    
    if(dtCh) { //Overwrite old data
    var edata = {
        type: 'toggle',
        name: 'value',
        message: 'Overwrite old data ?',
        initial: true,
        active: 'yes',
        inactive: 'no'
      }      
      questions.push(edata);
    }
    
    prompts(questions).then(function(re) {
        console.clear();
        if(re.value == false) {
            console.clear()
            console.log(chalk.red(figures.cross) + " Device login canceled")
            return;
        }
        if(re.mail == undefined || re.mail == "") {
            console.clear()
            console.log(chalk.red(figures.cross) + " Mail cannot be empty")
            return;
        } else if(re.id == undefined || re.id == "") {
            console.clear()
            console.log(chalk.red(figures.cross) + " Account id cannot be empty")
            return;
        }
    connect(re.mail,re.id)
    })
    function connect(mail,id) {
    var client = restify.createJsonClient({
        url: server
    });
    require('readline').createInterface({input: process.stdin,output: process.stdout}).on('SIGINT', () => {})
    
    var options = {
        path: '/userdetails',
        headers: {
          "user-email": encodeURIComponent(mail),
          "user-id"   : encodeURIComponent(id)
        }
    };
    
    const spinner = ora({
        text    : 'Verifying, wait while establishing connection',
        spinner : "dots"
    })
    spinner.color = 'red';
    spinner.start();
    var date = new Date().getMilliseconds()
    
    
    
    client.get(options, function(err,req,res,obj) {
        var ms   = - date + new Date().getMilliseconds()
        var ping = ms.toString().includes("-") ? ms.toString().split("-")[1] : ms;  
        setTimeout(function() {
            if(err) {
                console.clear();
                if(err.message.toString().includes("{") && JSON.parse(err.message).status == "fail") {
                    console.clear();
                    var message = obj.info == "Account not exist" ? {message:"Account not exist",action:"\nCant find the account you typed, go on add new account: \nhttps://www.projectann.xyz"} : {message:obj.info,action:""};
                    console.log(chalk.red(figures.cross) + " " + message.message);
                    console.log(chalk.cyan(message.action));
                    process.exit();
                    return;
                } else {
                    spinner.fail("Internet not available or server unreachable");
                    process.exit(1);
                }
            }
            spinner.info(`Connection established in : ${ping}ms`);
            spinner.start();
            if(obj.status == "fail") {
                console.clear()
                spinner.fail(obj.info);
                process.exit();
                return;
            } else {
                let s = [
                    {
                        type: 'select',
                        name: 'nvalue',
                        message: 'Choose a device',
                        choices: []
                    }
                ]
                spinner.info("Signed as " + obj.userName)
                if(obj.userIoT == null || (Array.isArray(obj.userIoT) && obj.userIoT.length == 0)) {
                    console.clear()
                    spinner.fail("No device added to console. Go on and add one " + figures.arrowDown)
                    console.log("\n\nhttps://www.projectann.xyz")
                    return;
                }
                obj.userIoT.forEach(element => {
                    s[0].choices.push({title: element.deviceName + " : " +  element.deviceID, value: element.deviceID + "_" + element.deviceName + "_" + element.deviceType});
                });
               prompts(s).then(function(resp) {
                   if(resp.nvalue == undefined) {
                       console.clear()
                       spinner.fail("Sign in failed. You have to select device");
                       process.exit(1)
                       return;
                   }
                   var e = resp.nvalue.toString().split("_");
                    var __data = {
                        mail       : mail,
                        id         : id,
                        deviceid   : e[0],
                        deviceName : e[1],
                        deviceType : e[2]
                    }
                    console.clear();
                    spinner.warn("Module taking information from server")
                    spinner.color = 'red';
                    spinner.text  = 'Wait while data is being processed';
                    spinner.start();
                    try {
                        data.write(__data)
                    } catch(err) {
                        console.log(chalk.red(figures.cross) + chalk.cyan(" Cannot save file. Are you sudo ? \n\n Try delete " + require('os').homedir() + "/iotConfig.data"));
                        console.log(chalk.cyan(figures.pointer + " " + err.message))
                        process.exit();
                    }   
    
                    setTimeout(function() {
                        spinner.color = 'green';
                        spinner.text  = 'Saving data';
                        spinner.start();
                        setTimeout(function() {
                            console.clear()
                            spinner.succeed(["Sign in success"])
                            console.log(
                                chalk.red("\n\n---Information---\n\n")+
                                chalk.cyan("Device information verified, you can start service by \n") +
                                chalk.bgRed("$") +
                                chalk.red(" sudo anniot --serviceStart")
                            )
                            process.exit();
                        },3000)
                    },5000)
                })
            }
        },5000)
    });
    }
  });
  program.command("signOut")
  .description("Sign out in this device")
  .action(function () { 
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
  });
  program.command("serviceStart")
  .description("Start IoT service")
  .action(function() {
    var Ann     = require("./module/module.js");
    var data    = require("./module/data.js");
    if(!data.check())  {
        console.log(chalk.red(figures.cross) + chalk.cyan(" Signout Failed. Cant find data")) 
        return;
    }
    console.log(chalk.green(figures.tick) + chalk.cyan(" Device Detected: " + data.read().deviceType));
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
  })

program.parse(process.argv);


var allOptions = ["--debug"];
var allCommands  = ["signOut","serviceStart","login"];

if(process.argv[2] == undefined) {
    program.help();
} else if((process.argv[2] !== undefined && process.argv[3] == undefined) && !allCommands.includes(process.argv[2])) {
    program.help();
} else if(process.argv[3] !== undefined && (!allOptions.includes(process.argv[2]) || !allCommands.includes(process.argv[3]))) {
    program.help();
}   