const moment = require('moment')
const Swal = require('sweetalert2')
const helper = require('./helper')
const store = require('./store')
const Db = require('./db')
const Edc = require('./edc')
const chart = require('./chart')
const Mqtt = require('./mqtt')
const NProgress = require('nprogress')

// **************************************************************************
// ============================= Form =======================================
// **************************************************************************

var isConnection = false
var settingData = {}
var conn = {}
var edcDevince = {}
var responseBuffer = []
var edcConnect = undefined
var dataTable = {}
var approveData = []
var ACTION = 'PAYMENT'
var STOREDATA = []

var currentDate = moment().locale('th').format('DD MMM') + ' ' + (+moment().locale('th').format('YYYY') + 543)

var _amount = 0
var _pid = ''
var _hn = ''
var _vn = ''
var _rightID = ''
var _fullname = ''
var _edcConnectType = 'MANUAL'

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

// **************************************************************************
// ========================= EventListener ==================================
// **************************************************************************

document.getElementById('btnMqttStart').addEventListener('click', (e) => {
    startMqtt()
})
document.getElementById('btnMqttStop').addEventListener('click', (e) => {
    stopMqtt()
})
document.getElementById('btnConnect').addEventListener('click', (e) => {
    edcStartConnect()
    _edcConnectType = 'MQTT'
})
document.getElementById('btnConnectPayment').addEventListener('click', (e) => {
    edcStartConnect()
    _edcConnectType = 'MANUAL'
})
document
    .getElementById('testConnection')
    .addEventListener('click', (e) => {
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
        Swal.fire({
            type: 'success',
            title: 'บันทึกการตั้งค่าเสร็จเรียบร้อย.',
            showConfirmButton: false,
            timer: 1000
        })
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
        _vn = e.srcElement.value
        getPriceAmount(e.srcElement.value)
        payAmount.focus()
    }
})

txtVn.addEventListener('click', (e) => {
    e.preventDefault()
    _vn = e.srcElement.value
    if (_vn) {
        getPriceAmount(e.srcElement.value)
        payAmount.focus()
    }
})

btnPay.addEventListener('click', (e) => {
    if (+payAmount.value > 0) {
        onSendRequestToPayment({
            hn: txtHn.value,
            vn: txtVn.value,
            pid: _pid,
            rightId: txtRight.value,
            amount: payAmount.value,
            fullname: _fullname
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
    const buttonsCancel = document
        .getElementById('table_id')
        .getElementsByClassName('btnActionCancel')
    for (const key in buttonsCancel) {
        if (buttonsCancel.hasOwnProperty(key)) {
            const element = buttonsCancel[key]
            element.addEventListener('click', e => {
                ACTION = 'CANCEL'
                const trace = e.srcElement.getAttribute('data-trace')
                const edcId = e.srcElement.getAttribute('data-edc-id')
                const status = e.srcElement.getAttribute('data-status')
                console.log('Cancel', trace, edcId, status)
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
                ACTION = 'REPRINT'
                const index = e.srcElement.getAttribute('data-index')
                const data = STOREDATA[index]
                confirmReprint(data)
                e.preventDefault()
            })
        }
    }
}

function confirmReprint(data) {
    Swal.fire({
        title: 'พิมพ์ซ้ำ?',
        text: 'คุณต้องการที่จะพิมพ์ซ้ำใช่หรือไม่.',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, reset it!'
    }).then(result => {
        if (result.value) {
           onSendRequestToReprint(data)
        }
    })
}

function onSendRequestToReprint(data) {
    _hn = data.hn
    _vn = data.vn
    _pid = data.pid
    _rightID = data.right_id
    _amount = data.amount
    _fullname = data.fullname
    console.log(edcConnect)
    if(edcConnect.isConnect === false){
        Swal.fire({
            type: 'error',
            title: 'Error',
            text:
                'ไม่สามารถเชื่อมต่อเครื่อง edc ได้ กรุณาตรวจสอบสาย usb หรือตั้งค่าเลือกเครื่อง edc ใหม่'
        })
    } else {
        edcConnect.reprint(data.trace)
        NProgress.start()
        Swal.fire({
            title: 'กรุณารอซักครู่ กำลังเชื่อมต่อเครื่อง EDC...',
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            // timer: 3000,
            onBeforeOpen: () => {
                Swal.showLoading()
            }
        })
    }
    
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

async function renderEdcPorts() {
    const ports = await Edc.getEdcSerialport()
    helper.buildHtmlOptions('edcPort', ports)
}

function resetSetting() {
    Swal.fire({
        title: 'Are you sure?',
        text: 'You want to reset this setting.',
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
            Swal.fire('Success!', 'Your setting has been empty.', 'success')
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
        console.log(error.message)
        Swal.fire({
            type: 'error',
            title: 'Error',
            text:
                'ไม่สามารถเชื่อมต่อเครื่อง edc ได้ กรุณาตรวจสอบสาย usb หรือตั้งค่าเลือกเครื่อง edc ใหม่'
        })
    }
}

function onSendRequestToPayment(data = { hn, vn, pid, amount, fullname, rightId }) {
    _hn = data.hn
    _vn = data.hn
    _pid = data.pid
    _rightID = data.rightId
    _amount = parseFloat(data.amount).toFixed(2)
    _fullname = data.fullname

    edcConnect.payment(_amount)
    
    NProgress.start()
    Swal.fire({
        title: 'กรุณารอซักครู่ กำลังเชื่อมต่อเครื่อง EDC...',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        // timer: 3000,
        onBeforeOpen: () => {
            Swal.showLoading()
        }
    })
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
    console.error(err.message)
}

function onClose() {
    console.log('on close')
}

function onData(data) {
    //const buffer = new Buffer(data)
    const buffer = Buffer.from(data)
    console.log('response buffer=', buffer.toString())
    disabledPaymentButton(true)
    const response = edcConnect.checkResponseBuffer(data)
    responseBuffer.push(response)

    if (responseBuffer.length === 2) {
        if (response.action === 'TXN CANCEL') {
            addLog('[EDC][TXN CANCEL] กดยกเลิกระหว่างทำรายการที่ตัวเครื่อง edc')
            Swal.fire({
                type: 'info',
                title: 'รายการนี้ถูกยกเลิกระหว่างทำรายการ กรุณารอซักครู่...',
                showConfirmButton: false,
                timer: 2300
            })
        }
    }
    if (responseBuffer.length === 4) {
        if (response.action === 'TXN CANCEL') {
            Swal.fire({
                type: 'success',
                title: 'ยกเลิกรายการเสร็จเรียบร้อย',
                showConfirmButton: false,
                timer: 2000
            })
        }

        if (ACTION === 'REPRINT') {
            Swal.fire({
                type: 'success',
                title: 'พิมพ์ซำ้เสร็จเรียบร้อย',
                showConfirmButton: false,
                timer: 2000
            })
        }
        
        if (_edcConnectType === 'MQTT') {
            Mqtt.publish(Mqtt.getResponseTopic(), JSON.stringify(response))
        } else {
            // type =  MANUAL
        }
        savePayment(response)
        NProgress.done()
    }
    addLog('[EDC][RESPONSE] EDC  ตอบกลับข้อมูลสถานะ: '+ (response.action || ''))
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
                vn: _vn,
                date: currentDate,
                fullname: _fullname,
                pid: _pid,
                time: res[0].time,
                clinic: res[0].dep_name
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
        Swal.fire({
            type: 'error',
            title: 'Error...',
            text: conn.error
        })
    } else {
        Swal.fire({
            type: 'success',
            title: 'Mysql is connected.',
            showConfirmButton: false,
            timer: 1000
        })
    }
}

async function getSummary() {
    const edcId = settingData.edc.location
    const approveData = await conn.getEdcApproveToDay(edcId, 1)
    const cancelData = await conn.getEdcApproveToDay(edcId, 0)
    const timeSeriesApprove = chart.dataToTimeSeries(
        approveData,
        'datetime',
        'amount'
    )
    const timeSeriesCancel = chart.dataToTimeSeries(
        cancelData,
        'datetime',
        'amount'
    )

    const data = await conn.getSummary(edcId, moment().format('YYYY-MM-DD'))

    if (data.length === 1) {
        const row = data[0]
        renderAnimationBox(boxAmount, '฿' + (row.amount || 0))
        renderAnimationBox(boxTotal, row.total || 0)
        renderAnimationBox(
            boxApproveCancel,
            (row.approve || 0) + ' / ' + (row.cancel || 0)
        )

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

async function renderEdcList() {
    const response = await getEdcApproveToday()
    STOREDATA = response;
    dataTable.clear()
    const type = [
        {code: 'TXNCANCEL', name: 'ยกเลิกระหว่างทำรายการ'},
        {code: 'PAYMENT', name:'ชำระเงิน'},
        {code: 'CANCEL', name: 'ยกเลิกรายการ'},
        {code: 'REPRINT', name: 'พิมพ์ซ้ำ'}
    ]
    approveData = response.map((value, index) => {
        const buttonCancelTemplate = `<button 
        data-index="${index}"
        data-trace="${value.trace}" 
        data-edc-id="${value.id}" 
        data-status="${value.status}" 
        type="button" class="button button-small button-outline btnActionCancel"> ยกเลิก </button>`

        const buttonReprintTemplate = `<button 
        data-index="${index}"
        data-trace="${value.trace}" 
        data-edc-id="${value.id}" 
        data-status="${value.status}" 
        type="button" class="button button-small button-outline btnActionReprint"> พิมพ์ซ้ำ</button>`

        const lineThrough = ( ['CANCEL','TXNCANCEL'].includes(value.type)  ? 'text-decoration:line-through; color:red' : 'color:green')
        const color = (value.status === 0 ? 'text-decoration:line-through color:red' : '')

        const message = type.filter((v)=>v.code === value.type)
        const status = (message.length===1) ? message[0].name : ''

        return [
            `<span style="${lineThrough}">${value.hn}</span>`,
            `<span style="${color}"> ${value.vn}</span>`,
            value.fullname,
            value.amount,
            `<span style="color:green">${value.approve_code}</span>`,
            moment(value.datetime).locale('th').format('H:mm'),
            status,
            (value.type === 'PAYMENT' ? buttonCancelTemplate + buttonReprintTemplate : '')
        ]
    })

    dataTable.rows.add(approveData)
    dataTable.draw()
    addEventOnClickOfTable()
}

async function savePayment(data = { app_code, trace, action }) {
    const amount = parseFloat(_amount).toFixed(2)
    let status = await conn.saveEdcApprove({
        approve_code: data.app_code,
        trace: data.trace,
        amount: amount,
        datetime: moment().format('YYYY-MM-DD HH:mm:ss'),
        pid: _pid,
        edc_id: settingData.edc.location,
        hn: _hn,
        vn: _vn,
        fullname: _fullname,
        right_id: _rightID,
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

async function searchVnByHn(hn) {
    setDetailVisit({
        vn: '',
        date: '',
        time: '',
        fullname: '',
        pid: '',
        clinic: ''
    })

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

        _fullname = vns[0].title + vns[0].name + ' ' + vns[0].surname
        _pid = vns[0].no_card
        _vn = vns[0].vn
        _hn = vns[0].hn

        txtVn.value = vns[0].vn // set default selected
        payAmount.value = vns[0].charge_total || 0

        addLog(`Search by Hn:  ${_hn}, ${_fullname}, พบ: ${vns.length}  รายการ`)

        setDetailVisit({
            vn: _vn,
            date: currentDate,
            fullname: _fullname,
            pid: _pid,
            time: vns[0].time,
            clinic: vns[0].dep_name
        })

        txtVn.focus() // set focus select an
    } else {
        const msg = `ค้นหาโดยใช้ Hn: ${hn} , ไม่พบผู้ป่วย`
        resetData()
        addLog(msg)
        setDetailVisit({
            vn: '',
            date: '',
            time: '',
            fullname: '',
            pid: '',
            clinic: ''
        })
        Swal.fire({
            type: 'info',
            title: 'ไม่พบรายการ',
            text: msg,
            timer: 2500
        })
    }
}

function setDetailVisit(data = { vn, date, fullname, pid, time, clinic }) {
    txtLabelVn.value = data.vn
    txtLabelDate.value = data.date
    txtLabelFullname.value = data.fullname
    txtLabelPID.value = data.pid
    txtLabelTime.value = data.time
    txtLabelClinic.value = data.clinic
}

async function updateStatus(edcId, status) {
    try {
        await conn.updateStatus(edcId, { status: status === 1 ? '0' : '1' })
    } catch (error) {
        console.log(error.message)
        addLog('Error: ' + error.message)
        return
    }
    reloadData()
}

function resetData() {
    _hn = ''
    _vn = ''
    _pid = ''
    _amount = 0
    _fullname = ''
    _rightID = ''

    txtVn.innerHTML = ''
    txtHn.value = ''
    payAmount.value = ''

    setDetailVisit({
        vn: '',
        date: '',
        time: '',
        fullname: '',
        pid: '',
        clinic: ''
    })
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
    addLog('[MQTT] MQTT is connect.')

    Mqtt.event.on('request', (data) => {
        addLog('[MQTT][REQUEST] ส่งข้อมูลเชื่อมต่อเครื่อง EDC เพื่อชำระเงิน')
        resetData()
        onSendRequestToPayment(data)
    })

    Mqtt.event.on('response', (data) => {
        addLog('[MQTT][RESPONSE] MQTT ตอบกลับข้อมูล')
        // Swal.close()
        //addLog('Response from edc.')
       // console.log('Event response payment', data)
       console.table(data)
    })
}

function stopMqtt() {
    addLog('[MQTT][STOP] MQTT หยุดการเชื่อมต่อ')
    Mqtt.stop()
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
}

init()
