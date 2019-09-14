const moment = require("moment");
const mqtt = require("mqtt");
const store = require("./store")
const Db = require("./db")

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

var isConnection = false;
var settingData = {};
var conn = {};

var txtLogs = document.getElementById("txtLogs");

var txtMqttHost = document.getElementById("txtMqttHost");
var txtMqttUser = document.getElementById("txtMqttUser");
var txtMqttPassword = document.getElementById("txtMqttPassword");

var txtHost = document.getElementById("txtHost");
var txtUsername = document.getElementById("txtUsername");
var txtPassword = document.getElementById("txtPassword");
var txtDatabaseName = document.getElementById("txtDatabaseName");

var divEdcBox = document.getElementById("edcBox");
var txtEdcPort = document.getElementById("edcPort");
var txtEdcId = document.getElementById("edcId");
var txtBaudRate = document.getElementById("baudRate");
var txtParity = document.getElementById("parity");
var txtStopBits = document.getElementById("stopBits");
var txtDataBits = document.getElementById("dataBits");

var settingPage = document.getElementById("setting-page");
var indexPage = document.getElementById("index-page");

// **************************************************************************
// ============================= Event ==================================
// **************************************************************************

document.getElementById("btnBack").addEventListener("click", function(e) {
    showIndexPage();
});

document.getElementById("btnSetting").addEventListener("click", function(e) {
    showSettingPage()
});

document.getElementById("saveSetting").addEventListener("click", function(e) {
    saveSetting();
    init();
    showIndexPage();
});

document.getElementById("resetSetting").addEventListener("click", function(e) {
    resetSetting();
    initFormData();
});

// **************************************************************************
// ============================= Functions ==================================
// **************************************************************************

function showSettingPage(){
    settingPage.style.display = 'block';
    indexPage.style.display = 'none';
}

function showIndexPage(){
    indexPage.style.display = 'block';
    settingPage.style.display = 'none';
}

function addLog(msg){
    txtLogs.value += `\n${moment().format("HH:mm:ss")} - ${msg}`;
    txtLogs.scrollTop = txtLogs.scrollHeight;
}

async function renderEdcLocations() {
    let data = await conn.getEdcLocations();
    txtEdcId.innerHTML = "";
    if (Array.isArray(data)) {
        data.forEach(edc => {
            var opt = document.createElement("option");
            opt.appendChild(document.createTextNode(edc.location_name));
            opt.value = edc.edc_id;
            txtEdcId.appendChild(opt);
        });
    }
  }

function initFormData(){
    settingData = store.getSetting();

    txtMqttHost.value = settingData.mqtt.host;
    txtMqttUser.value = settingData.mqtt.username;
    txtMqttPassword.value = settingData.mqtt.password;

    txtHost.value = settingData.mysql.host;
    txtUsername.value = settingData.mysql.username;
    txtPassword.value = settingData.mysql.password;
    txtDatabaseName.value = settingData.mysql.database;

    txtEdcPort.value = settingData.edc.port;
    txtEdcId.value = settingData.edc.location;
    txtBaudRate.value = settingData.edc.baudrate;
    txtParity.value = settingData.edc.parity;
    txtStopBits.value = settingData.edc.stopbits;
    txtDataBits.value = settingData.edc.databits;
}

async function createConection(){
    conn =  new Db({
        host: settingData.mysql.host,
        username: settingData.mysql.username,
        password: settingData.mysql.password,
        database: settingData.mysql.database ,
    });
    isConnection = await conn.checkIsConnection();
    if(isConnection===false){
        addLog(conn.error);
        console.log(conn.error);
        divEdcBox.style.display = 'none';
    }else{
        renderEdcLocations();
        divEdcBox.style.display = 'block';
    }
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
        },
        edc: {
            port: txtEdcPort.value,
            location: txtEdcId.value,
            baudrate: txtBaudRate.value,
            parity: txtParity.value,
            stopbits: txtStopBits.value,
            databits: txtDataBits.value
        }
    });
}

function resetSetting(){
    if(confirm('Are you sure you want to reset this setting? ')){
        store.clear()
        store.initSetting();
        setTimeout(() => {
            initFormData();
        }, 1000); 
    }
}

function init(){
    initFormData()
    createConection();
}

// **************************************************************************
// ============================= Initialize ==================================
// **************************************************************************


init()
