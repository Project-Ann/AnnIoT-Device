/*
    All rights reserved to Project Ann®, AnnIoT™ is trademark of Project Ann
    2018-2019
*/

const i            = require("socket.io-client");
const restify      = require("restify-clients");
const chalk        = require("chalk");
const EventEmitter = require('events');
const isPi         = require('detect-rpi');
let   retry        = 1;

/**
 * Raspberry pi Configure client details
 * @param {string} id       - Unique account id 
 * @param {string} mail     - Mail adress
 * @param {string} deviceId - Device ID
 */

exports.raspberry3 = function(id,mail,deviceId) {
    const Gpio = require('pigpio').Gpio;
    const dht = require('dht');
    var logined = false;  //Kullanıcı giriş yaptı
    var type    = type; //Varsayılan bağlntı tipi = User

    var loginData = {
        id: id,
        mail:mail,
        type: "device",
        deviceID: deviceId
    }

    if(id == undefined || mail == undefined || deviceId == undefined) {
        throw new Error("Module did not configured correctly");   
    }
    /**
     * Connect to server
     * @returns {void} - Server connection boolean
    */
this.connect = function(options) {
    var reconnectMode = options.reconnect == undefined || options.reconnect == null ? false : true;
    var debugmode     = options.debug     == undefined || options.debug     == null ? false : true;
    class MyEmitter extends EventEmitter {}
    const emitter = new MyEmitter();


	var client = i.connect('https://www.projectann.xyz',{
		transportOptions: {
			polling: {
				extraHeaders: {
					'loginobject': JSON.stringify(loginData)
				}
			}
		}
	});
	
    client.on('connect', function() {

        if(!isPi()) {
            emitter.emit("warn","This module created for only Raspberry PI ")
        }

        client.on("server_deviceSearch",function(callback){
            callback(loginData)
        })

        emitter.emit('onConnect',true); 

        client.on("connectionSuccess",function(globalMessage) {
            emitter.emit("onSuccess",true)
        })   

        client.once("server_welcomeMessage",function(globalMessage) {
            var match = globalMessage.id == client.id ? true : false;
            emitter.emit("welcomeMessage",globalMessage);
        })

        client.on("server_wroomMessage",function(globalMessage) {
            emitter.emit("roomMessage",globalMessage)
        })

        client.on("deviceWriteGpio_" + deviceId,function(port,value) {
            var pin = new Gpio(Number(port), {mode: Gpio.OUTPUT})
            pin.digitalWrite(Number(value));
            emitter.emit("gpioWrite",{port:port,value:value})
         })
		 
		client.on("devicePwmGpio_" + deviceId,function(port,value) {
            var pin = new Gpio(Number(port), {mode: Gpio.OUTPUT})
            pin.pwmWrite(Number(value));
            emitter.emit("gpioPwm",{port:port,value:value})
        }) 

        client.on("deviceReadGpio_" + deviceId,function(port,funct) {
            const epio = require("onoff").Gpio
            const button = new epio(Number(port),"in",{debounceTimeout: 10})
            var data = {
                type     : "digitalRead",
                deviceid : deviceId,
                value    : button.readSync() == 1 ? 0 : 1,
                id       : funct
            }
            client.emit("broadcastDevice",data)
         })

         client.on("deviceDht11Gpio_" + deviceId,function(port,funct) {
            const sensor = dht(port,11);
            sensor.read()
            sensor.on('result', data => {
                var data = {
                    type       : "dht11read",
                    deviceid   : deviceId,
                    id         : funct,
                    temperature: data.temperature,
                    humidity   : data.humidity
                }
                client.emit("broadcastDevice",data)
            })
         })

        client.on("broadcast_roomMessage",function(globalMessage) {
            emitter.emit("broadcast",globalMessage)
        })

        client.on("user_err",function(err) {
            emitter.emit("errorm",err.message);
        })

    })

   
    client.on('connect_error', (error) => {
        var ete = error == "xhr poll error" || error == "transport close" ? error : "serverConnection"
        var qte = error == "xhr poll error" || error == "transport close" ? error : "Cannot reach to the server"
        emitter.emit("errorm",qte);
        if(reconnectMode == true) {
            retryConnection(ete);
            return;
        }
	});

    client.on('disconnect', function(reason){
        emitter.emit("errorm",reason.message);
        if(reconnectMode == true) {
            retryConnection(reason);
            return;
        }
    });

    client.on('error', function(reason){
        emitter.emit("errorm",reason);
        if(reconnectMode == true) {
            retryConnection(reason);
            return;
        }
    });

    function retryConnection(error) {
        client.open();
    }

    return emitter;
}
}