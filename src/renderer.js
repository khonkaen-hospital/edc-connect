
const serialport = require("serialport");
const bsplit = require("buffer-split");
const moment = require("moment");
const mqtt = require("mqtt");
const store = require("./store")

console.log(store.getSetting());
// store.saveSetting({
//     mqtt: {
//         host: '192.168.0.100',
//         username: 'root',
//         password: '1234'
//     },
//     mysql: {
//         host: '192.168.0.111',
//         username: 'user',
//         password: 'pass',
//         database: 'dbname',
//     }
// });
//store.clear();

// **************************************************************************
// ============================= Form =======================================
// **************************************************************************

var txtMqttHost = document.getElementById("txtMqttHost");
var txtMqttUser = document.getElementById("txtMqttUser");
var txtMqttPassword = document.getElementById("txtMqttPassword");
var txtHost = document.getElementById("txtHost");
var txtUsername = document.getElementById("txtUsername");
var txtPassword = document.getElementById("txtPassword");
var txtDatabaseName = document.getElementById("txtDatabaseName");

// **************************************************************************
// ============================= Event ==================================
// **************************************************************************

document.getElementById("saveSetting").addEventListener("click", function(e) {
    saveSetting();
    console.log(store.getSetting());
});

// **************************************************************************
// ============================= Functions ==================================
// **************************************************************************


function initFormData(){
    var settingData = store.getSetting();
    txtMqttHost.value = settingData.mqtt.host;
    txtMqttUser.value = settingData.mqtt.username;
    txtMqttPassword.value = settingData.mqtt.password;
    txtHost.value = settingData.mysql.host;
    txtUsername.value = settingData.mysql.username;
    txtPassword.value = settingData.mysql.password;
    txtDatabaseName.value = settingData.mysql.database;
}

function init(){
    initFormData()
}

function saveSetting(){
    store.saveSetting({
        mqtt: {
            host: txtMqttHost.value,
            username: txtMqttUser.value,
            password: txtMqttPassword.value
        },
        mysql: {
            host: txtHost.value,
            username: txtUsername.value,
            password: txtPassword.value,
            database: txtDatabaseName.value ,
        }
    });
}

function resetSetting(){
    store.clear();
    initFormData()
}

// **************************************************************************
// ============================= Initialize ==================================
// **************************************************************************


init()
