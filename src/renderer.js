const NProgress = require('nprogress')
const moment = require('moment')
const Swal = require('sweetalert2')
const helper = require('./lib/helper')
const store = require('./lib/store')
const Db = require('./lib/db')
const Edc = require('./lib/edc')
const chart = require('./lib/chart')
const Mqtt = require('./lib/mqtt')
const popupBox = require('./lib/popupBox')

var EventEmitter = require('events');

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
    pid: '',
    right_id: '',
    amount: '',
    fullname: ''
}

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

var txtLogs = document.getElementById('txtLogs')

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

var txtHn = document.getElementById('txtHn')
var txtVn = document.getElementById('txtVn')
var txtRight = document.getElementById('txtRight')
var payAmount = document.getElementById('payAmount')
var btnPay = document.getElementById('btnPay')

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
    Mqtt.publish(txtTopic.value,txtData.value)
    popupBox.info('ส่งข้อมูลเรียบร้อย')
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
        getPriceAmount(vn)
        txtRight.focus()
    }
})

txtVn.addEventListener('click', (e) => {
    e.preventDefault()
    const vn = e.srcElement.value
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

btnPay.addEventListener('click', (e) => {
    if (+payAmount.value > 0) {
        onSendRequestToPayment({
            hn: txtHn.value,
            vn: txtVn.value,
            pid: EDCDATA.pid,
            right_id: +txtRight.value,
            amount: payAmount.value,
            fullname: EDCDATA.fullname
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
    popupBox.confirm('พิมพ์ซ้ำ?','คุณต้องการที่จะพิมพ์ซ้ำใช่หรือไม่.')
    .then(confirm => {
        if(confirm){
            onSendRequestToReprint(data)
        }
    })
}

function confirmCancel(data) {
    popupBox.confirm('ยกเลิกรายการชำระเงิน?','คุณต้องการที่จะยกเลิกรายการใช่หรือไม่.')
    .then(confirm => {
        if(confirm){
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
    if(edcConnect.isConnect === false){
        popupBox.error('ไม่สามารถเชื่อมต่อเครื่อง edc ได้ กรุณากดปุ่ม "เชื่อมต่อเครื่อง EDC"')
    } else {
        edcEvent.emit('beforePayment', {
            action: 'PAYMENT',
            data: data
        })
    }
}

function onSendRequestToReprint(data) {
    if(edcConnect.isConnect === false){
        popupBox.error('ไม่สามารถเชื่อมต่อเครื่อง edc ได้ กรุณากดปุ่ม "เชื่อมต่อเครื่อง EDC"')
    } else {
        edcEvent.emit('beforeReprint', {
            action: 'REPRINT',
            data: data
        })
    }
}

function onSendRequestToCancel(data) {
    if(edcConnect.isConnect === false){
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
                data: EDCDATA,
                response: response
            })
            addLog('[EDC][TXN CANCEL] กดยกเลิกระหว่างทำรายการที่ตัวเครื่อง edc')
            popupBox.loading('รายการนี้ถูกยกเลิกระหว่างทำรายการ กรุณารอซักครู่...')
        }
    }

    if (responseBuffer.length === 4) {

        if (ACTION === 'PAYMENT') {
            popupBox.success('ชำระเงินเสร็จเรียบร้อย.')
            edcEvent.emit('affterPayment', {
                action: ACTION,
                data: EDCDATA,
                response: response
            })
        } else if (ACTION === 'REPRINT') {
            popupBox.success('พิมพ์ซำ้รายการเสร็จเรียบร้อย.')
            edcEvent.emit('affterReprint', {
                action: ACTION,
                data: ACTIVEDATA,
                response: response
            })
        } else if (ACTION === 'CANCEL' || ACTION === 'TXNCANCEL' ) {
            popupBox.success('ยกเลิกรายการเสร็จเรียบร้อย.')
            if(ACTION === 'CANCEL') {
                    edcEvent.emit('affterCancel', {
                    action: ACTION,
                    data: ACTIVEDATA,
                    response: response
                })
            }
        }

        if (_edcConnectType === 'MQTT') {
            Mqtt.publish(Mqtt.getResponseTopic(), JSON.stringify(response))
        } else {

        }
        savePayment(response)
        NProgress.done()
    }
    addLog('[EDC][RESPONSE] EDC ตอบกลับข้อมูลสถานะ: '+ (ACTION || ''))
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
                clinic: res[0].dep_name
            })
            setEdcData({
                vn: txtVn.value,
                amount: total
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
    txtHn.disabled = value
    txtVn.disabled = value
    txtRight.disabled = value
    payAmount.disabled = value
    btnCancel.disabled = value
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
    let status = await conn.saveEdcApprove({
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
        {code: 'TXNCANCEL', name: '<i class="fa fa-ban" aria-hidden="true"></i> ยกเลิกระหว่างทำรายการ'},
        {code: 'PAYMENT', name:'<i class="fa fa-credit-card" aria-hidden="true"></i> ชำระเงิน'},
        {code: 'CANCEL', name: '<i class="fa fa-undo" aria-hidden="true"></i> ยกเลิกรายการ'},
        {code: 'REPRINT', name: '<i class="fa fa-print" aria-hidden="true"></i> พิมพ์ซ้ำ'}
    ]

    approveData = response.map((value, index) => {
        const btnCancelTemplate = `<button data-index="${index}" type="button" class="button button-small button-outline btnActionCancel"> ยกเลิก </button>`
        const btnReprintTemplate = `<button data-index="${index}" type="button" class="button button-small button-outline btnActionReprint"> พิมพ์ซ้ำ</button>`
        let lineThrough = '';
        if((value.type === 'PAYMENT' && value.status == 0) || ['CANCEL','TXNCANCEL'].includes(value.type)){
             lineThrough = 'text-decoration:line-through; color:red'
        } else if(value.type === 'REPRINT') {
            lineThrough = ''
        }
        else {
             lineThrough = 'color:green'
        }
        const message = type.filter((v)=>v.code === value.type)
        const status = (message.length===1) ? message[0].name : ''
        return [
            `<span style="${lineThrough}">${value.vn}</span>`,
            `<span style="${lineThrough}">${value.hn}</span>`,
            value.fullname,
            value.amount,
            moment(value.datetime).locale('th').format('H:mm'),
            `<span style="color:green">${value.approve_code}</span>`,
            value.trace,
            status,
            (value.type === 'PAYMENT' &&  value.status == 1 ? btnCancelTemplate + btnReprintTemplate : '')
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
}

async function renderEdcRoles() {
    const data = await conn.getEdcRoles()
    const array = helper.map(data, 'code', 'name')
    helper.buildHtmlOptions('txtRight', array)
}

async function renderEdcPorts() {
    const ports = await Edc.getEdcSerialport()
    helper.buildHtmlOptions('edcPort', ports)
}

async function searchVnByHn(hn) {
    setDetailVisit(false)
    let vnIsApprove = []
    let isApproveVns = []
    let vns = []
    try {
        vns = await conn.getVisitByHn(hn)
    } catch (error) {
        addLog('Error: ' + error.message)
        return
    }
    txtVn.innerHTML = ''

    if (vns.length > 0) {
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
                var opt = document.createElement('option')
                if (v.isPayment) {
                    opt.disabled = true
                    opt.style = 'font-weight:bold color:green text-decoration: line-through'
                }
                opt.appendChild(
                    document.createTextNode(
                        v.vn + ',ค่ารักษา: ' + (v.charge_total || 0) + ', ' + v.dep_name + ', ' + v.time
                    )
                )
                opt.value = v.vn
                txtVn.appendChild(opt)
            })
        }

        txtVn.value = vns[0].vn // set default selected
        payAmount.value = vns[0].charge_total || 0
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
            clinic: vns[0].dep_name
        })
        setDetailVisit({
            vn: vn,
            date: currentDate,
            fullname: fullname,
            pid: pid,
            time: vns[0].time,
            clinic: vns[0].dep_name
        })

        txtVn.focus() // set focus select an
        addLog(`Search by Hn:  ${hn}, ${fullname}, พบ: ${vns.length}  รายการ`)
    } else {
        const msg = `ค้นหาโดยใช้ Hn: ${hn} , ไม่พบผู้ป่วย`
        resetData()
        addLog(msg)
        setDetailVisit(false)
        popupBox.info('ไม่พบรายการที่ค้นหา!')
    }
}

function setDetailVisit(data = { vn, date, fullname, pid, time, clinic }) {
    txtLabelVn.value = data===false ? '' : data.vn
    txtLabelDate.value = data===false ? '' : data.date
    txtLabelFullname.value = data===false ? '' : data.fullname
    txtLabelPID.value = data===false ? '' : data.pid
    txtLabelTime.value = data===false ? '' : data.time
    txtLabelClinic.value = data===false ? '' : data.clinic
}

async function updateStatus(edcId, status) {
    try {
        await conn.updateStatus(edcId, {'status': status})
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
        console.log('beforeReprint',data)
        console.table(data)
        ACTION = data.action
        ACTIVEDATA = data.data
        setEdcData(data.data)
        edcConnect.reprint(data.data.trace)
        NProgress.start()
        popupBox.loading('กรุณารอซักครู่ กำลังเชื่อมต่อเครื่อง EDC...')
    })

    edcEvent.on('beforeCancel', (data) => {
        console.log('beforeCancel',data)
        console.table(data)
        ACTION = data.action
        ACTIVEDATA = data.data
        setEdcData(data.data)
        edcConnect.cancel(data.data.trace)
        NProgress.start()
        popupBox.loading('กรุณารอซักครู่ กำลังเชื่อมต่อเครื่อง EDC...')
    })

    edcEvent.on('affterPayment', (data) => {
        console.log('affterPayment',data)
    })

    edcEvent.on('affterReprint', (data) => {
        console.log('affterReprint',data)
    })

    edcEvent.on('affterCancel',  (data) => {
        console.log('affterCancel',data)
        console.table(data)
         updateStatus(data.data.id, 0)
    })

    edcEvent.on('affterTxnCancel', (data) => {
        console.log('affterTxnCancel',data)
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
    helper.setActiveMenu('menus', 'menu', 'active')
    helper.setActivePage('menus', 'menu', 'pageActive')
    initEvents()
}

init()