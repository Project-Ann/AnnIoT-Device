const i            = require("socket.io-client");
const restify      = require("restify-clients");
const chalk        = require("chalk");
const EventEmitter = require('events');
const isPi         = require('detect-rpi');


/**
 * Raspberry pi Configure client details
 * @param {string} id       - Unique account id 
 * @param {string} mail     - Mail adress
 * @param {string} type     - User connection or device connection
 */

exports.raspberry = function(id,mail,deviceId) {

    if(!isPi()) {
        var e = new Error("This module created for only Raspberry PI ")
        throw e;
    }
    const Gpio = require('pigpio').Gpio;

    var logined = false;  //Kullanıcı giriş yaptı
    var type    = type; //Varsayılan bağlntı tipi = User

    var loginData = {
        id: id,
        mail:mail,
        type: "device",
        deviceID: deviceId
    }

    //
    // Catch error
    //

    if(id == undefined || mail == undefined || deviceId == undefined) {
        throw new Error("Module did not configured correctly");   
    }
    /**
     * Connect to server
     * @returns {void} - Server connection boolean
    */
this.connect = function() {
    class MyEmitter extends EventEmitter {}
    const emitter = new MyEmitter();


	var client = i.connect('https://iot.projectann.xyz',{
		transportOptions: {
			polling: {
				extraHeaders: {
					'loginobject': JSON.stringify(loginData)
				}
			}
		}
	});
	
    client.on('connect', function() {

        //console.log(chalk.red("Connection established in") + chalk.cyan(": ") + chalk.magenta(milliseconds) + "ms")
        client.once("server_welcomeMessage",function(globalMessage) {
            var match = globalMessage.id == client.id ? true : false;
            console.log(match == true ? "You're safe" : "Security Issue")
        })


        
        client.on("server_wroomMessage",function(globalMessage) {
            emitter.emit('onConnect',true);
            client.on("deviceWriteGpio_" + deviceId,function(port,value) {
               var pin = new Gpio(Number(port), {mode: Gpio.OUTPUT})
               pin.digitalWrite(Number(value));
            })

            client.on("deviceSendGpio_" + deviceId,function(port,value) {
                var pin = new Gpio(Number(port), {mode: Gpio.OUTPUT});
                pin.digitalWrite(Number(value));
                setTimeout(function() {
                    var v = value == 1 ? 0 : 1
                    pin.digitalWrite(v)
                },1000)
            })

            client.on("deviceReadGpio_" + deviceId,function(port,funct) {
                var pin = new Gpio(Number(port),{mode: Gpio.INPUT})
                var data = {
                    deviceid : deviceId,
                    value    : pin.digitalRead()
                }
                client.emit("broadcastDevice",data)
             })
            

        })

        client.on("broadcast_roomMessage",function(globalMessage) {
            emitter.emit("brodcast",globalMessage)
        })

        client.on("user_err",function(err) {
            var e = new Error(err.message)
            e.code = err.code
            throw e;
        })

    })

    client.on('disconnect', function(reason){
        client.open();
    });
    
    client.on('connect_error', (error) => {
		console.log(chalk.magenta("\n\n--------") + chalk.red("Reconnecting Failed") + chalk.magenta("--------\n\n"))
        process.exit();
	});


    return emitter;
}
}