const { app } = require('electron').remote;
const NProgress = require('nprogress')
const moment = require('moment')
const Pikaday = require('pikaday')
const Swal = require('sweetalert2')
const helper = require('./lib/helper')
const store = require('./lib/store')
const Db = require('./lib/db')
const Edc = require('./lib/edc')
const chart = require('./lib/chart')
const Mqtt = require('./lib/mqtt')
const popupBox = require('./lib/popupBox')

var EventEmitter = require('events');

const feedURL = `https://update.electronjs.org/khonkaen-hospital/edc-connect/${process.platform}-${process.arch}/${app.getVersion()}`
console.log('=======', feedURL)
// **************************************************************************
// ============================= Form =======================================
// **************************************************************************

var ACTION = 'PAYMENT'
var STOREDATA = []
var ACTIVEDATA = []
var EDCDATA = {
    action: '',
    hn: '',
    vn: '',
    an: '',
    pid: '',
    right_id: '',
    amount: '',
    fullname: ''
}
var isApproveVns = []
var edcEvent = new EventEmitter()
var isConnection = false
var settingData = {}
var conn = {}
var edcDevince = {}
var responseBuffer = []
var edcConnect = undefined
var dataTable = {}
var approveData = []
var _edcConnectType = 'MANUAL'
var currentDate = moment().locale('th').format('DD MMM') + ' ' + (+moment().locale('th').format('YYYY') + 543)
var TEMPHN = '';
var TEMPVNS = '';

var txtHnLabel = document.getElementById('txtHnLabel')
txtHnLabel.innerHTML = 'วันที่ตรวจ (' + currentDate + ')'
var txtLogs = document.getElementById('txtLogs')
var labelAbout = document.getElementById('labelAbout')

var txtMqttHost = document.getElementById('txtMqttHost')
var txtMqttUser = document.getElementById('txtMqttUser')
var txtMqttPassword = document.getElementById('txtMqttPassword')

var txtHost = document.getElementById('txtHost')
var txtUsername = document.getElementById('txtUsername')
var txtPassword = document.getElementById('txtPassword')
var txtDatabaseName = document.getElementById('txtDatabaseName')
var txtVisitTableName = document.getElementById('txtVisitTableName')

var divEdcBox = document.getElementById('edcBox')
var txtEdcPort = document.getElementById('edcPort')
var txtEdcId = document.getElementById('edcId')
var txtBaudRate = document.getElementById('baudRate')
var txtParity = document.getElementById('parity')
var txtStopBits = document.getElementById('stopBits')
var txtDataBits = document.getElementById('dataBits')

var boxAmount = document.getElementById('boxAmount')
var boxTotal = document.getElementById('boxTotal')
var boxApproveCancel = document.getElementById('boxApproveCancel')

var txtDate = document.getElementById('txtDate')
var txtHn = document.getElementById('txtHn')
var txtVn = document.getElementById('txtVn')
var txtRight = document.getElementById('txtRight')
var payAmount = document.getElementById('payAmount')
var btnPay = document.getElementById('btnPay')
var txtOpdright = document.getElementById('txtOpdright')
var txtWard = document.getElementById('txtWard')
var txtAn = document.getElementById('txtAn')

var txtLabelVn = document.getElementById('txtLabelVn')
var txtLabelDate = document.getElementById('txtLabelDate')
var txtLabelTime = document.getElementById('txtLabelTime')
var txtLabelFullname = document.getElementById('txtLabelFullname')
var txtLabelPID = document.getElementById('txtLabelPID')
var txtLabelClinic = document.getElementById('txtLabelClinic')

var btnConnect = document.getElementById('btnConnect')
var btnConnectPayment = document.getElementById('btnConnectPayment')
var btnCancel = document.getElementById('btnCancel')

var txtTopic = document.getElementById('txtTopic')
var txtData = document.getElementById('txtData')
var boxIsPayment = document.getElementById('boxIsPayment')
txtDate.value = moment().format('YYYY-MM-DD');

var picker = new Pikaday({
    field: txtDate,
    format: 'YYYY-MM-DD',
    i18n: {
        previousMonth: 'Previous Month',
        nextMonth: 'Next Month',
        months: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
        weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        weekdaysShort: ['อ.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
    }
});

var appName = `${app.getName()} [v${app.getVersion()}]`
document.title = appName
labelAbout.innerHTML = appName + ', Copyright © Khon Kaen Hospital'

// **************************************************************************
// ========================= EventListener ==================================
// **************************************************************************

document.getElementById('btnMqttStart').addEventListener('click', (e) => {
    startMqtt()
})
document.getElementById('btnMqttStop').addEventListener('click', (e) => {
    stopMqtt()
})
document.getElementById('btnMqttTestPayment').addEventListener('click', (e) => {
    if (Mqtt.publish(txtTopic.value, txtData.value)) {
        popupBox.info('ส่งข้อมูลเรียบร้อย')
    } else {
        popupBox.info('กรุณาเชื่อมต่อ MQTT ')
    }
})


document.getElementById('btnConnect').addEventListener('click', (e) => {
    edcStartConnect()
    _edcConnectType = 'MQTT'
})
document.getElementById('btnConnectPayment').addEventListener('click', (e) => {
    edcStartConnect()
    _edcConnectType = 'MANUAL'
})
document.getElementById('testConnection').addEventListener('click', (e) => {
    saveSetting()
    initFormData()
    initDb()
    checkMysqlIsConnect()
})

document.getElementById('saveSetting').addEventListener('click', (e) => {
    saveSetting()
    initFormData()
    initDb()
    if (isConnection) {
        popupBox.success('บันทึกการตั้งค่าเสร็จเรียบร้อย.')
        reloadData()
    } else {
        checkMysqlIsConnect()
    }
})

document.getElementById('resetSetting').addEventListener('click', (e) => {
    resetSetting()
    initFormData()
})

document
    .getElementById('reloadSerialport')
    .addEventListener('click', (e) => {
        renderEdcPorts()
    })

document.querySelectorAll('input[name=txtType]').forEach(r => {
    r.addEventListener('click', (e) => {
        console.log(e.target.value);
        showHideIpd(e.target.value);
        txtHn.focus();
        // resetData()

    })
});


txtHn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault()
        searchVnByHn(e.srcElement.value)
    }
})

txtVn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault()
        const vn = e.srcElement.value
        if (isApproveVns.includes(vn)) {
            btnPay.disabled = true;
            boxIsPayment.style.display = 'block'
        } else {
            btnPay.disabled = false
            boxIsPayment.style.display = 'none'
        }
        getPriceAmount(vn)
        txtRight.focus()
    }
})

txtVn.addEventListener('click', (e) => {
    e.preventDefault()
    const vn = e.srcElement.value
    if (e.srcElement.dataset.ispayment == 1) {
        btnPay.disabled = true;
        boxIsPayment.style.display = 'block'
    } else {
        btnPay.disabled = false;
        boxIsPayment.style.display = 'none'
    }
    if (vn) {
        getPriceAmount(vn)
        txtRight.focus()
    }
})

txtRight.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault()
        payAmount.focus()
    }
})

payAmount.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault()
        if (e.srcElement.value > 0) {
            btnPay.focus()
        } else {
            txtHn.focus()
        }
    }
})

btnPay.addEventListener('click', (e) => {

    if (+payAmount.value > 0) {
        popupBox.confirm('คุณต้องการจ่ายเงินใช่หรือไม่?')
            .then(confirm => {
                if (confirm) {
                    onSendRequestToPayment({
                        hn: txtHn.value,
                        vn: txtVn.value,
                        pid: EDCDATA.pid,
                        right_id: +txtRight.value,
                        amount: payAmount.value,
                        fullname: EDCDATA.fullname
                    })
                }
            })

    } else {
        addLog('จำนวนเงินทีจ่ายต้องมากกว่า 0 !')
        payAmount.focus()
    }
})

// btnPay.addEventListener('keydown', (event) => {
//   if (event.key === "Enter") {
//       event.preventDefault()
//       if(+payAmount.value > 0){
//         payment(parseFloat(payAmount.value).toFixed(2))
//       }else {
//         edcLog('จำนวนเงินทีจ่ายต้องมากกว่า 0 !')
//         payAmount.focus()
//       }
//   }
// })

// **************************************************************************
// ============================= Functions ==================================
// **************************************************************************

function toThaiDate(value) {
    return value ? (moment(value).locale('th').format('DD MMM') + ' ' + (+moment(value).locale('th').format('YYYY') + 543)) : '';
}

function showHideIpd(value) {
    document.getElementById('ipdBox').style.display = (value === 'opd' ? 'none' : 'block');
    document.getElementById('boxDate').style.display = (value === 'ipd' ? 'none' : 'block');
    document.getElementById('boxVn').style.display = (value === 'ipd' ? 'none' : 'block');
}

async function addEventOnClickOfTable() {

    const buttonsCancel = document.getElementById('table_id').getElementsByClassName('btnActionCancel')

    for (const key in buttonsCancel) {
        if (buttonsCancel.hasOwnProperty(key)) {
            const element = buttonsCancel[key]
            element.addEventListener('click', e => {
                const index = e.srcElement.getAttribute('data-index')
                const data = STOREDATA[index]
                confirmCancel(data)
                e.preventDefault()
            })
        }
    }

    const buttonsReprint = document
        .getElementById('table_id')
        .getElementsByClassName('btnActionReprint')

    for (const key in buttonsReprint) {
        if (buttonsReprint.hasOwnProperty(key)) {
            const element = buttonsReprint[key]
            element.addEventListener('click', e => {
                const index = e.srcElement.getAttribute('data-index')
                const data = STOREDATA[index]
                confirmReprint(data)
                e.preventDefault()
            })
        }
    }
}

function confirmReprint(data) {
    popupBox.confirm('พิมพ์ซ้ำ?', 'คุณต้องการที่จะพิมพ์ซ้ำใช่หรือไม่.')
        .then(confirm => {
            if (confirm) {
                onSendRequestToReprint(data)
            }
        })
}

function confirmCancel(data) {
    popupBox.confirm('ยกเลิกรายการชำระเงิน?', 'คุณต้องการที่จะยกเลิกรายการใช่หรือไม่.')
        .then(confirm => {
            if (confirm) {
                onSendRequestToCancel(data)
            }
        })
}

function initFormData() {
    settingData = store.getSetting()

    txtMqttHost.value = settingData.mqtt.host
    txtMqttUser.value = settingData.mqtt.username
    txtMqttPassword.value = settingData.mqtt.password

    txtHost.value = settingData.mysql.host
    txtUsername.value = settingData.mysql.username
    txtPassword.value = settingData.mysql.password
    txtDatabaseName.value = settingData.mysql.database
    txtVisitTableName.value = settingData.mysql.visitTableName

    txtEdcPort.value = settingData.edc.port
    txtEdcId.value = settingData.edc.location
    txtBaudRate.value = settingData.edc.baudrate
    txtParity.value = settingData.edc.parity
    txtStopBits.value = settingData.edc.stopbits
    txtDataBits.value = settingData.edc.databits
}

function addLog(msg) {
    txtLogs.value += `\n${moment().format('HH:mm:ss')} - ${msg}`
    txtLogs.scrollTop = txtLogs.scrollHeight
}

function resetSetting() {
    Swal.fire({
        title: 'ลบข้อมูลการตั้งค่า?',
        text: 'คุณต้องการที่จะลบข้อมูลการตั้งค่าทั้งหมด ใช่หรือไม่.',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, reset it!'
    }).then(result => {
        if (result.value) {
            store.clear()
            store.initSetting()
            setTimeout(() => {
                initFormData()
            }, 1000)
            Swal.fire('สำเร็จ!', 'คุณได้ทำการลบข้อการตั้งค่าเสร็จเรียบร้อย.', 'success')
        }
    })
}

// **************************************************************************
// ============================ EDC Functions ===============================
// **************************************************************************

function initEdc() {
    edcConnect = new Edc()
    edcConnect.on('error', msg => {
        Swal.fire({
            type: 'error',
            title: 'Error',
            text: msg
        })
    })
}

function edcStartConnect() {
    try {
        edcDevince = edcConnect.connect({
            portName: settingData.edc.port,
            baudRate: +settingData.edc.baudrate,
            parity: settingData.edc.parity,
            stopBits: +settingData.edc.stopbits,
            dataBits: +settingData.edc.databits
        })

        edcDevince.on('open', onOpen)
        edcDevince.on('error', onError)
        edcDevince.on('close', onClose)
        edcDevince.on('data', onData)

    } catch (error) {
        popupBox.error('ไม่สามารถเชื่อมต่อเครื่อง edc ได้ กรุณาตั้งค่าเลือกเครื่อง edc ใหม่')
    }
}

function onSendRequestToPayment(data = { hn, vn, pid, amount, fullname, right_id }) {
    data.amount = parseFloat(data.amount).toFixed(2)
    if (edcConnect.isConnect === false) {
        popupBox.error('ไม่สามารถเชื่อมต่อเครื่อง edc ได้ กรุณากดปุ่ม "เชื่อมต่อเครื่อง EDC"')
    } else {
        edcEvent.emit('beforePayment', {
            action: 'PAYMENT',
            data: data
        })
    }
}

function onSendRequestToReprint(data) {
    if (edcConnect.isConnect === false) {
        popupBox.error('ไม่สามารถเชื่อมต่อเครื่อง edc ได้ กรุณากดปุ่ม "เชื่อมต่อเครื่อง EDC"')
    } else {
        edcEvent.emit('beforeReprint', {
            action: 'REPRINT',
            data: data
        })
    }
}

function onSendRequestToCancel(data) {
    if (edcConnect.isConnect === false) {
        popupBox.error('ไม่สามารถเชื่อมต่อเครื่อง edc ได้ กรุณากดปุ่ม "เชื่อมต่อเครื่อง EDC"')
    } else {
        edcEvent.emit('beforeCancel', {
            action: 'CANCEL',
            data: data
        })
    }
}

function onOpen() {
    Swal.fire({
        type: 'success',
        title: 'EDC is connected',
        timer: 1000,
        showConfirmButton: false,
        onAfterClose: () => {
            txtHn.focus()
        }
    })
    addLog('[EDC][CONNECTED] EDC is connected')
    btnConnect.innerHTML = '<i class="fa fa-refresh fa-spin" aria-hidden="true"></i> Connecting... '
    btnConnectPayment.innerHTML = '<i class="fa fa-refresh fa-spin" aria-hidden="true"></i> Connecting... '
    if (_edcConnectType === 'MQTT') {
        startMqtt()
    } else {
        // type =  MANUAL
        disabledPaymentButton(false)
    }
}

function onError(err) {
    if (err.message === 'Error Resource temporarily unavailable Cannot lock port') {
        popupBox.success('Edc is connected...')
    } else {
        popupBox.error(err.message)
    }
    addLog(err.message)
}

function onClose() {
    console.log('on close')
}

function onData(data) {

    const response = edcConnect.checkResponseBuffer(data)
    responseBuffer.push(response)
    disabledPaymentButton(true)

    const buffer = Buffer.from(data)
    console.log('response buffer=', buffer.toString())

    if (responseBuffer.length === 2) {
        if (response.action === 'TXN CANCEL') {
            edcEvent.emit('affterTxnCancel', {
                action: 'TXNCANCEL',
                data: EDCDATA,
                response: response
            })
            addLog('[EDC][TXN CANCEL] กดยกเลิกระหว่างทำรายการที่ตัวเครื่อง edc')
            popupBox.loading('รายการนี้ถูกยกเลิกระหว่างทำรายการ กรุณารอซักครู่...')
        }
    }

    if (responseBuffer.length === 4) {

        checkResponseMessage(ACTION, ACTIVEDATA, response)

        if (_edcConnectType === 'MQTT') {
            Mqtt.publish(Mqtt.getResponseTopic(), JSON.stringify({
                action: ACTION,
                data: ACTIVEDATA,
                response: response
            }))
        } else {

        }
        savePayment(response)
        NProgress.done()
    }
    addLog('[EDC][RESPONSE] EDC ตอบกลับข้อมูลสถานะ: ' + (ACTION || ''))
}

function checkResponseMessage(actionName, data, response) {
    if (actionName === 'PAYMENT') {
        popupBox.success('ชำระเงินเสร็จเรียบร้อย.', 1500, txtHn)
        edcEvent.emit('affterPayment', {
            action: actionName,
            data: data,
            response: response
        })
    } else if (actionName === 'REPRINT') {
        popupBox.success('พิมพ์ซำ้รายการเสร็จเรียบร้อย.')
        edcEvent.emit('affterReprint', {
            action: actionName,
            data: data,
            response: response
        })
    } else if (actionName === 'CANCEL') {
        popupBox.success('ยกเลิกรายการเสร็จเรียบร้อย.')
        edcEvent.emit('affterCancel', {
            action: actionName,
            data: data,
            response: response
        })
    } else if (actionName === 'TXNCANCEL') {
        popupBox.success('ยกเลิกรายการเสร็จเรียบร้อย.')
        edcEvent.emit('affterTxnCancel', {
            action: actionName,
            data: data,
            response: response
        })
    }
}

async function saveSetting() {
    await store.saveSetting({
        mqtt: {
            host: txtMqttHost.value,
            username: txtMqttUser.value,
            password: txtMqttPassword.value
        },
        mysql: {
            host: txtHost.value,
            username: txtUsername.value,
            password: txtPassword.value,
            database: txtDatabaseName.value,
            visitTableName: txtVisitTableName.value
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
    console.log('port', txtEdcPort.value, 'location:', txtEdcId.value)

    addLog('[SAVE SETTING] บันทึกข้อมูลการตั้งค่า')
}

async function getPriceAmount(vn) {
    let total = 0
    try {
        const res = await conn.getPriceAmount(vn)
        if (res.length > 0) {
            total = res[0].charge_total || 0
            setDetailVisit({
                vn: txtVn.value,
                date: currentDate,
                fullname: EDCDATA.fullname,
                pid: EDCDATA.pid,
                time: res[0].time,
                clinic: res[0].dep_name,
                ward: vns[0].ward_name,
                pttype: vns[0].pttype_name,
                an: vns[0].ipd_an
            })
            setEdcData({
                vn: txtVn.value,
                an: txtAn.value,
                amount: total,
            })
        }
        payAmount.value = total
    } catch (error) {
        console.log(error.message)
        addLog('Error: ' + error.message)
        return 0
    }
}

function disabledPaymentButton(value) {
    btnPay.disabled = value
    txtDate.disabled = value
    txtHn.disabled = value
    txtVn.disabled = value
    txtRight.disabled = value
    payAmount.disabled = value
    btnCancel.disabled = value
    txtTypeIpd.disabled = value;
    txtTypeOpd.disabled = value;
}

// **************************************************************************
// ================================== MySQL =================================
// **************************************************************************

async function initDb() {
    conn = new Db({
        host: settingData.mysql.host,
        username: settingData.mysql.username,
        password: settingData.mysql.password,
        database: settingData.mysql.database,
        visitTableName: settingData.mysql.visitTableName
    })

    conn.connect()
    isConnection = await conn.checkIsConnection()
    if (isConnection === false) {
        divEdcBox.style.display = 'none'
    } else {
        divEdcBox.style.display = 'block'
        renderEdcLocations()
        renderEdcRoles()
        reloadData()
    }

    conn.knex.on('start', function (builder) {
        NProgress.start()
    })
    conn.knex.on('query-response', function (response, obj, builder) {
        NProgress.done()
    })
}

async function checkMysqlIsConnect() {
    isConnection = await conn.checkIsConnection()
    if (isConnection === false) {
        popupBox.error('Error!', conn.error)
    } else {
        popupBox.success('Mysql is connected!', conn.error)
    }
}

async function getSummary() {
    const edcId = settingData.edc.location
    const approveData = await conn.getEdcApproveToDay(edcId, 1)
    const cancelData = await conn.getEdcApproveToDay(edcId, 0)
    const timeSeriesApprove = chart.dataToTimeSeries(approveData, 'datetime', 'amount')
    const timeSeriesCancel = chart.dataToTimeSeries(cancelData, 'datetime', 'amount')
    const data = await conn.getSummary(edcId, moment().format('YYYY-MM-DD'))

    if (data.length === 1) {
        const row = data[0]
        renderAnimationBox(boxAmount, '฿' + (row.amount || 0))
        renderAnimationBox(boxTotal, row.total || 0)
        renderAnimationBox(boxApproveCancel, (row.approve || 0) + ' / ' + (row.cancel || 0))
        const pieData = [+row.approve, +row.cancel]
        chart.lineChart('edcLineChart', [timeSeriesApprove, timeSeriesCancel])
        chart.pieChart('edcPieChart', pieData)
    }
}

async function getEdcApproveToday() {
    const today = moment().format('YYYY-MM-DD')
    const response = await conn.getEdcApproveByDate(
        settingData.edc.location,
        today
    )
    return response
}

async function savePayment(data = { app_code, trace, action }) {
    const amount = parseFloat(EDCDATA.amount).toFixed(2)
    let response = await conn.saveEdcApprove({
        approve_code: data.app_code,
        trace: data.trace,
        amount: amount,
        datetime: moment().format('YYYY-MM-DD HH:mm:ss'),
        pid: EDCDATA.pid,
        edc_id: settingData.edc.location,
        hn: EDCDATA.hn,
        vn: EDCDATA.vn,
        fullname: EDCDATA.fullname,
        right_id: EDCDATA.right_id,
        status: data.action === 'TXN CANCEL' ? 0 : 1,
        action: data.action,
        response_data: JSON.stringify(data),
        updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
        type: ACTION
    })
    reloadData()
    resetData()
    let status = await checkVisitsIsPaymentAll(TEMPHN);
    if (!status) {
        txtHn.value = TEMPHN;
    }
    setTimeout(() => {
        txtHn.focus()
    }, 1000);
}

function renderAnimationBox(element, value) {
    element.style.animation = 'none'
    // element.offsetHeight
    element.style.animation = null
    element.className = 'swing-in-top-fwd'
    element.innerHTML = value
}

async function renderEdcList() {
    const response = await getEdcApproveToday()
    STOREDATA = response;
    dataTable.clear()
    const type = [
        { code: 'TXNCANCEL', name: '<i class="fa fa-ban" aria-hidden="true"></i> ยกเลิกระหว่างทำรายการ' },
        { code: 'PAYMENT', name: '<i class="fa fa-credit-card" aria-hidden="true"></i> ชำระเงิน' },
        { code: 'CANCEL', name: '<i class="fa fa-undo" aria-hidden="true"></i> ยกเลิกรายการ' },
        { code: 'REPRINT', name: '<i class="fa fa-print" aria-hidden="true"></i> พิมพ์ซ้ำ' }
    ]

    approveData = response.map((value, index) => {
        const btnCancelTemplate = `<button data-index="${index}" type="button" class="button button-small button-outline btnActionCancel"> ยกเลิก </button>`
        const btnReprintTemplate = `<button data-index="${index}" type="button" class="button button-small button-outline btnActionReprint"> พิมพ์ซ้ำ</button>`
        let lineThrough = '';
        if ((value.type === 'PAYMENT' && value.status == 0) || ['CANCEL', 'TXNCANCEL'].includes(value.type)) {
            lineThrough = 'text-decoration:line-through; color:red'
        } else if (value.type === 'REPRINT') {
            lineThrough = ''
        }
        else {
            lineThrough = 'color:green'
        }
        const message = type.filter((v) => v.code === value.type)
        const status = (message.length === 1) ? message[0].name : ''
        return [
            `<span style="${lineThrough}">${value.vn}</span>`,
            `<span style="${lineThrough}">${value.hn}</span>`,
            value.fullname,
            value.amount,
            moment(value.datetime).locale('th').format('H:mm'),
            `<span style="color:green">${value.approve_code}</span>`,
            value.trace,
            status,
            (value.type === 'PAYMENT' && value.status == 1 ? btnCancelTemplate + btnReprintTemplate : '')
        ]
    })

    dataTable.rows.add(approveData)
    dataTable.draw()
    addEventOnClickOfTable()
}

async function renderEdcLocations() {
    const data = await conn.getEdcLocations()
    const array = helper.map(data, 'edc_id', 'location_name')
    helper.buildHtmlOptions('edcId', array)
    txtEdcId.value = +settingData.edc.location
}

async function renderEdcRoles() {
    const data = await conn.getEdcRoles()
    const array = helper.map(data, 'code', 'name')
    helper.buildHtmlOptions('txtRight', array)
}

async function renderEdcPorts() {
    const ports = await Edc.getEdcSerialport()
    helper.buildHtmlOptions('edcPort', ports)
    txtEdcPort.value = settingData.edc.port
}

async function checkVisitsIsPaymentAll(hn) {
    let visits = await conn.getVisitByHn(hn)
    let isPayment = [];
    let isPaymentItems = [];
    let approves = [];
    if (visits.length > 0) {
        approves = visits.map(v => v.vn)
        let res = await conn.checkIsPayment(approves)
        isPaymentItems = res.map(v => v.vn)
        console.log(approves, isPaymentItems)
    }
    return approves.length === isPaymentItems.length;
}

async function searchVnByHn(hn) {

    setDetailVisit(false);

    let patientType = document.querySelector('input[name="txtType"]:checked').value;

    TEMPHN = hn;
    let vnIsApprove = []
    let visitIpd = {};
    isApproveVns.length = [];
    let vns = []
    let priceIpd = 0;
    try {
        if (patientType === 'ipd') {
            vns = await conn.getIpdByHn(hn);
            if (vns.length > 0) {
                let getPrice = await conn.getPriceIpd(vns[0].an);
                priceIpd = getPrice ? getPrice.total : 0;
            }
            vns = vns.map(r => {
                r.ipd_an = r.an;
                return r;
            });
        } else {
            vns = await conn.getVisitByHn(hn, txtDate.value)
        }

    } catch (error) {
        console.log(patientType);
        addLog('Error: ' + error.message)
        return
    }


    txtVn.innerHTML = ''

    if (vns.length > 0) {
        visitIpd = await conn.getVisitVn(vns[0].vn);
        vnIsApprove = vns.map(v => v.vn)
        if (vnIsApprove.length > 0) {
            try {
                let res = await conn.checkIsPayment(vnIsApprove)
                res = Array.isArray(res) ? res : []
                isApproveVns = res.map(v => v.vn)
            } catch (error) {
                console.log(error.message)
                addLog('Error: ' + error.message)
                return
            }

            vns.map(v => {
                v.isPayment = isApproveVns.includes(v.vn)
                let opt = document.createElement('option')
                let dataIspayment = document.createAttribute("data-ispayment");
                if (v.isPayment) {
                    //opt.disabled = true
                    dataIspayment.value = 1
                    opt.style = 'font-weight:bold; color:green; text-decoration: line-through;'
                } else {
                    dataIspayment.value = 0
                }
                opt.setAttributeNode(dataIspayment);
                opt.appendChild(
                    document.createTextNode(
                        v.vn + ',ค่ารักษา: ' + (v.charge_total || 0) + ', ' + v.dep_name + ', ' + v.time
                    )
                )
                opt.value = v.vn
                txtVn.appendChild(opt)
            })
            TEMPVNS = vns
        }
        if (vns[0].isPayment === true) {
            btnPay.disabled = true
            boxIsPayment.style.display = 'block'
        } else {
            btnPay.disabled = false
            boxIsPayment.style.display = 'none'
        }
        txtVn.value = vns[0].vn // set default selected
        payAmount.value = patientType === 'ipd' ? priceIpd : (vns[0].charge_total || 0);
        const hn = vns[0].hn
        const vn = vns[0].vn
        const pid = vns[0].no_card
        const fullname = vns[0].title + vns[0].name + ' ' + vns[0].surname
        setEdcData({
            vn: vn,
            hn: hn,
            fullname: fullname,
            pid: pid,
            time: vns[0].time,
            clinic: vns[0].dep_name,
            an: vns[0].ipd_an
        })

        setDetailVisit({
            vn: vn,
            date: patientType === 'ipd' ? toThaiDate(vns[0].admite) : currentDate,
            fullname: fullname,
            pid: pid,
            time: vns[0].time,
            clinic: patientType === 'ipd' ? visitIpd.dep_name : vns[0].dep_name,
            ward: vns[0].ward_name,
            pttype: vns[0].pttype_name,
            an: vns[0].ipd_an,
            disc: vns[0].disc ? toThaiDate(vns[0].disc) : ''
        })

        txtVn.focus() // set focus select an
        addLog(`Search by Hn:  ${hn}, ${fullname}, พบ: ${vns.length}  รายการ`)
    } else {
        const msg = `ค้นหาโดยใช้ Hn: ${hn} , ไม่พบผู้ป่วย`
        resetData()
        addLog(msg)
        setDetailVisit(false)
        popupBox.info('ไม่พบรายการที่ค้นหา!')
        boxIsPayment.style.display = 'none'
        btnPay.disabled = true;

    }
}

function setDetailVisit(data = { vn, date, fullname, pid, time, clinic, ward, pttype, an, disc }) {
    txtLabelVn.value = data === false ? '' : data.vn
    txtLabelDate.value = data === false ? '' : data.date
    txtLabelFullname.value = data === false ? '' : data.fullname
    txtLabelPID.value = data === false ? '' : data.pid
    txtLabelTime.value = data === false ? '' : data.time
    txtLabelClinic.value = data === false ? '' : data.clinic
    txtWard.value = data === false ? '' : data.ward
    txtOpdright.value = data === false ? '' : data.pttype
    txtAn.value = data === false ? '' : data.an
    txtDischarge.value = data === false ? '' : data.disc
}

async function updateStatus(edcId, status) {
    try {
        await conn.updateStatus(edcId, { 'status': status })
    } catch (error) {
        console.log(error.message)
        addLog('Error: ' + error.message)
        return
    }
    reloadData()
}

function resetData() {
    txtVn.innerHTML = ''
    txtHn.value = ''
    payAmount.value = ''
    setDetailVisit(false)
    responseBuffer.length = 0
    disabledPaymentButton(false)
    txtHn.focus()
    console.log('on reset data')
}

function reloadData() {
    getSummary()
    renderEdcList()
}

// **************************************************************************
// ============================== MQTT Function =============================
// **************************************************************************

function startMqtt() {
    Mqtt.start({
        edcid: settingData.edc.location,
        host: settingData.mqtt.host,
        username: settingData.mqtt.host,
        password: settingData.mqtt.host
    })

    let client = Mqtt.getClient()

    addLog('[MQTT] MQTT is connect.')

    Mqtt.event.on('request', (data) => {
        addLog('[MQTT][REQUEST] ส่งข้อมูลเชื่อมต่อเครื่อง EDC เพื่อชำระเงิน')
        onSendRequestToPayment(data)
    })

    Mqtt.event.on('response', (data) => {
        addLog('[MQTT][RESPONSE] MQTT ตอบกลับข้อมูล')
        console.table(data)
    })

    client.on('offline', () => {
        addLog('[MQTT] MQTT Offline')
    })
    client.on('close', () => {
        addLog('[MQTT] MQTT Close')
    })
}

function stopMqtt() {
    addLog('[MQTT] หยุดการเชื่อมต่อ MQTT')
    Mqtt.stop()
}

function initEvents() {

    edcEvent.on('beforePayment', (response) => {
        console.log('beforePayment')
        console.table(response)
        NProgress.start()
        ACTION = response.action
        setEdcData(response.data)
        edcConnect.payment(response.data.amount, response.data.right_id)
        popupBox.loading('กรุณารอซักครู่...กำลังเชื่อมต่อเครื่อง EDC')
    })

    edcEvent.on('beforeReprint', (data) => {
        console.log('beforeReprint', data)
        console.table(data)
        ACTION = data.action
        ACTIVEDATA = data.data
        setEdcData(data.data)
        edcConnect.reprint(data.data.trace)
        NProgress.start()
        popupBox.loading('กรุณารอซักครู่ กำลังเชื่อมต่อเครื่อง EDC...')
    })

    edcEvent.on('beforeCancel', (data) => {
        console.log('beforeCancel', data)
        console.table(data)
        ACTION = data.action
        ACTIVEDATA = data.data
        setEdcData(data.data)
        edcConnect.cancel(data.data.trace)
        NProgress.start()
        popupBox.loading('กรุณารอซักครู่ กำลังเชื่อมต่อเครื่อง EDC...')
    })

    edcEvent.on('affterPayment', (data) => {
        console.log('affterPayment', data, TEMPHN)
        txtHn.focus()
    })

    edcEvent.on('affterReprint', (data) => {
        console.log('affterReprint', data)
    })

    edcEvent.on('affterCancel', (data) => {
        console.log('affterCancel', data)
        console.table(data)
        updateStatus(data.data.id, 0)
    })

    edcEvent.on('affterTxnCancel', (data) => {
        console.log('affterTxnCancel', data)
        ACTION = data.action
    })
}


function setEdcData(data) {
    return Object.assign(EDCDATA, data)
}

// **************************************************************************
// ============================== Initialize ================================
// **************************************************************************

async function init() {
    initFormData()
    dataTable = helper.initDataTable()
    initDb()
    initEdc()
    renderEdcPorts()
    helper.setActiveMenu('menus', 'menu', 'active', txtHn)
    helper.setActivePage('menus', 'menu', 'pageActive')
    initEvents()
}

init()