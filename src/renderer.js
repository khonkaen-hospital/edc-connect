const moment = require("moment")
const mqtt   = require("mqtt")
const Swal   = require('sweetalert2')
const helper = require("./helper")
const store  = require("./store")
const Db     = require("./db")
const edc    = require("./edc")
const chart    = require("./chart")


// **************************************************************************
// ============================= Form =======================================
// **************************************************************************

var isConnection = false
var settingData = {}
var conn = {}
var edcDevince = undefined;
let responseBuffer = [];

var _amount = 0;
var _cid = "";
var _hn = "";
var _vn = "";
var _fullname = "";
var _edcId = "";

var txtLogs = document.getElementById("txtLogs")

var txtMqttHost = document.getElementById("txtMqttHost")
var txtMqttUser = document.getElementById("txtMqttUser")
var txtMqttPassword = document.getElementById("txtMqttPassword")

var txtHost = document.getElementById("txtHost")
var txtUsername = document.getElementById("txtUsername")
var txtPassword = document.getElementById("txtPassword")
var txtDatabaseName = document.getElementById("txtDatabaseName")

var divEdcBox = document.getElementById("edcBox")
var txtEdcPort = document.getElementById("edcPort")
var txtEdcId = document.getElementById("edcId")
var txtBaudRate = document.getElementById("baudRate")
var txtParity = document.getElementById("parity")
var txtStopBits = document.getElementById("stopBits")
var txtDataBits = document.getElementById("dataBits")

var settingPage = document.getElementById("setting-page")
var indexPage = document.getElementById("index-page")

var boxAmount = document.getElementById("boxAmount")
var boxTotal = document.getElementById("boxTotal")
var boxApproveCancel = document.getElementById("boxApproveCancel")



// **************************************************************************
// ========================= EventListener ==================================
// **************************************************************************

document.getElementById("btnConnect").addEventListener("click", function(e) {
    edcConnect();
})

document.getElementById("btnBack").addEventListener("click", function(e) {
    showIndexPage()
})

document.getElementById("testConnection").addEventListener("click", function(e) {
    saveSetting()
    initFormData()
    createConection()
    checkMysqlIsConnect()
})

document.getElementById("btnSetting").addEventListener("click", function(e) {
    showSettingPage()
})

document.getElementById("saveSetting").addEventListener("click", function(e) {
    saveSetting()
    initFormData()
    createConection()
    if(isConnection) {
        Swal.fire({
            type: 'success',
            title: 'Your setting has been saved.',
            showConfirmButton: false,
            timer: 1000
        })
        showIndexPage()
        getSummary()
    } else {
        checkMysqlIsConnect()
    }
})

document.getElementById("resetSetting").addEventListener("click", function(e) {
    resetSetting()
    initFormData()
})

document.getElementById("reloadSerialport").addEventListener("click", function(e) {
    renderEdcPorts();
})

// **************************************************************************
// ============================= Functions ==================================
// **************************************************************************

function showSettingPage(){
    settingPage.style.display = 'block'
    indexPage.style.display = 'none'
}

function showIndexPage(){
    indexPage.style.display = 'block'
    settingPage.style.display = 'none'
}

function addLog(msg){
    txtLogs.value += `\n${moment().format("HH:mm:ss")} - ${msg}`
    txtLogs.scrollTop = txtLogs.scrollHeight
}

async function renderEdcLocations() {
    let data = await conn.getEdcLocations()
    let array = helper.map(data,'edc_id','location_name')
    helper.buildHtmlOptions('edcId', array)
}

async function renderEdcPorts(){
    let ports = await edc.getEdcSerialport();
    helper.buildHtmlOptions('edcPort', ports)
    Swal.fire({
        title: 'Loading... EDC usb devices.',
        showConfirmButton: false,
        timer: 4000,
        onBeforeOpen: () => {
            Swal.showLoading()
          }
    })
}

function initFormData(){
    settingData = store.getSetting()

    txtMqttHost.value = settingData.mqtt.host
    txtMqttUser.value = settingData.mqtt.username
    txtMqttPassword.value = settingData.mqtt.password

    txtHost.value = settingData.mysql.host
    txtUsername.value = settingData.mysql.username
    txtPassword.value = settingData.mysql.password
    txtDatabaseName.value = settingData.mysql.database

    txtEdcPort.value = settingData.edc.port
    txtEdcId.value = settingData.edc.location
    txtBaudRate.value = settingData.edc.baudrate
    txtParity.value = settingData.edc.parity
    txtStopBits.value = settingData.edc.stopbits
    txtDataBits.value = settingData.edc.databits
}

async function createConection() {
    conn = new Db({
        host: settingData.mysql.host,
        username: settingData.mysql.username,
        password: settingData.mysql.password,
        database: settingData.mysql.database ,
    })
    isConnection = await conn.checkIsConnection()
    if(isConnection === false) {
        divEdcBox.style.display = 'none'
    } else {
        divEdcBox.style.display = 'block'
        renderEdcLocations()
    }
}

async function checkMysqlIsConnect() {
    isConnection = await conn.checkIsConnection()
    if(isConnection === false) {
        divEdcBox.style.display = 'none'
        Swal.fire({
            type: 'error',
            title: 'Error...',
            text: conn.error
        })
    } else{
        divEdcBox.style.display = 'block'
        Swal.fire({
            type: 'success',
            title: 'Mysql is connected.',
            showConfirmButton: false,
            timer: 1000
        })
    }
}

function saveSetting() {
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
    })
}

function resetSetting() {
    Swal.fire({
        title: 'Are you sure?',
        text: "You want to reset this setting.",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.value) {
            store.clear()
            store.initSetting()
            setTimeout(() => {
                initFormData()
            }, 1000) 
          Swal.fire(
            'Success!',
            'Your setting has been empty.',
            'success'
          )
        }
      })
}

function edcConnect() {
    let edcConnect = new edc();
    try {
        edcDevince = edcConnect.connect({
            portName: settingData.edc.port,
            baudRate: +settingData.edc.baudrate,
            parity: settingData.edc.parity,
            stopBits: +settingData.edc.stopbits,
            dataBits: +settingData.edc.databits
        })

        edcDevince.on("open", onOpen);
        edcDevince.on("error", onError);
        edcDevince.on("close", onClose);
        edcDevince.on("data", onData);
        
    } catch (error) {
        console.log(error.message)
        Swal.fire({
            type: 'error',
            title: 'Error',
            text: 'ไม่สามารถเชื่อมต่อเครื่อง edc ได้ กรุณาตรวจสอบสาย usb หรือตั้งค่าเลือกเครื่อง edc ใหม่'
        })
    }
}

function onOpen(){
    Swal.fire({
        type: 'success',
        title: 'EDC is connected',
        timer: 3000
    })
    addLog('EDC is connected')
    btnConnect.innerHTML = '<i class="fa fa-refresh fa-spin" aria-hidden="true"></i> Connecting... ';
}

function onError(err){
    if(err.message == 'Error Resource temporarily unavailable Cannot lock port'){
        Swal.fire({
            timer: 1000,
            type: 'info',
            title: 'Edc is connected...'
        })
    } else {
        Swal.fire({
            type: 'info',
            title: err.message
        })
    }
    addLog(err.message)
    console.error(err.message);
}

function onClose(){
    console.log('on close');
}

function onData(data) {
    let buffer = new Buffer(data);
    console.log(buffer.toString);

    let response = edcDevince.checkResponseBuffer(data);
    responseBuffer.push(response);
    if (responseBuffer.length == 4) {
      savePayment(response);
    }
}

function onSendPayment(data = {hn, vn, cid, amount, fullname}) 
{
    _hn       = data.hn;
    _vn       = data.hn;
    _cid      = data.cid;
    _amount   = data.amount;
    _fullname = data.fullname;
}

function savePayment(data = {app_code, trace, action}){
    let amount = parseFloat(_amount).toFixed(2);
    conn.saveEdcApprove({
        approve_code: data.app_code,
        trace: data.trace,
        amount: amount,
        datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        pid: _cid,
        edc_id: settingData.edc.location,
        hn: _hn,
        vn: _vn,
        fullname: _fullname,
        right_id: 0,
        status: data.action == "TXN CANCEL" ? 0 : 1,
        action: data.action,
        response_data: JSON.stringify(data),
        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
    });
}

function clearData(){
    _hn       = '';
    _vn       = '';
    _cid      = '';
    _amount   = 0;
    _fullname = '';
}

async function getApproveByToday(edcId){
    return await conn.getEdcApproveToDay(edcId);
}

async function getSummary(){
    edcId = settingData.edc.location;
    let approveData = await conn.getEdcApproveToDay(edcId);
    let timeSeries = chart.dataToTimeSeries(approveData, 'datetime', 'amount')
    let data = await conn.getSummary(edcId,moment().format('YYYY-MM-DD'));

    if(data.length==1){
        let row = data[0];
        renderAnimationBox(boxAmount, '฿'+(row.amount || 0))
        renderAnimationBox(boxTotal, (row.total || 0))
        renderAnimationBox(boxApproveCancel, (row.approve || 0) +' / '+ (row.cancel || 0))
       
        let pieData = [+row.approve, +row.cancel]
        chart.lineChart('edcLineChart', timeSeries)
        chart.pieChart('edcPieChart', pieData)
    }
}

function renderAnimationBox(element, value){
    element.style.animation = 'none';
    element.offsetHeight;
    element.style.animation = null; 
    element.className = 'swing-in-top-fwd'
    element.innerHTML = value;
}


async function init() {
    initFormData()
    createConection()
    renderEdcPorts()
    getSummary()
    
}

// **************************************************************************
// ============================= Initialize ==================================
// **************************************************************************

init()



