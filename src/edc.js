const serialport = require("serialport");
const bsplit = require("buffer-split");
const path = require("path");

const STRUCTURE_KEY = {
  stx: [0x02],
  lenght: [0x00, 0x35],
  reverseForFurfure: [0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30,0x30],
  presentationHeaderSale: [0x31, 0x30, 0x32, 0x32, 0x30, 0x30, 0x30, 0x1c],
  presentationHeaderCancel: [0x31, 0x30, 0x32, 0x36, 0x30, 0x30, 0x30, 0x1c],
  presentationHeaderReprint: [0x31, 0x30, 0x39, 0x32, 0x30, 0x30, 0x30, 0x1c],
  fieldTypeSale: [
    0x34,0x30, // field data: field type
    0x00,0x12 // field data: lenght
  ],
  fieldTypeSaleChildCard: [ // บัตรเด็ก 
    0x37,0x31, // field data: field type
    0x00,0x13 // field data: lenght
  ],
  fieldTypeSaleForeignCard: [ // บัตรต่างชาติ
    0x37,0x32, // field data: field type
    0x00,0x13 // field data: lenght
  ],
  fieldTypeCancel: [
    0x36,0x35, // field data: field type
    0x00,0x06 // field data: lenght
  ],
  fieldTypeReprint: [
    0x36,0x35, // field data: field type
    0x00,0x06 // field data: lenght
  ],
  etxLrc: [0x1c, 0x03, 0x14]
};

class Edc {
  constructor() {
    this.isConnect = false;
    this.port = undefined;
  }

  connect(config = { portName, baudRate, parity, stopBits, dataBits }) {
    this.port = new serialport(config.portName, {
      baudRate: +config.baudRate,
      parity: config.parity,
      stopBits: +config.stopBits,
      dataBits: +config.dataBits
    });

    this.port.on("open", () => {});
    this.port.on("error", (err) => {});
    this.port.on("close", () => {});
    this.port.on("data", (data) => {});

    return this.port;
  }

  static getEdcSerialport() {
    return new Promise((resolve, reject) => {
      serialport.list().then(ports => {
        let data = ports
          .filter(value => value.manufacturer !== undefined)
          .map(port => {
            return {
              id: port.comName,
              label: port.comName + ", " + port.manufacturer
            };
          });
        resolve(data);
      });
    });
  }

  sendMessage(msg) {
    var buffer = new Buffer(msg);
    console.log('buffer send=',buffer.toString());
    this.port.write(buffer, function(err) {
      if (err) {
        return console.log("Error on write: ", err.message);
      }
      console.info("buffer send complte");
    });
  }

  checkResponseBuffer(data) {
    let strReturn = new Object();
    let buffer = new Buffer(data);
    strReturn.success = false;
    if (data.length < 2) {
      return strReturn;
    }

    if (data) {
      let delim = new Buffer([28]),
        strReceive = bsplit(data, delim),
        fileType,
        strValue;
      strReturn.success = true;
      strReturn.rawData = buffer;

      for (var i = 0; i < strReceive.length; i++) {
        strReceive[i] = strReceive[i].toString();
        if (strReceive[i].length < 6) {
          continue;
        }

        fileType = strReceive[i].substring(0, 2);
        strValue = strReceive[i].substring(4, strReceive[i].length);

        switch (fileType) {
          case "01":
            strReturn.app_code = strValue.trim();
            break;
          case "65":
            strReturn.trace = strValue.trim();
            break;
          case "30":
            strReturn.cid = strValue.trim();
            break;
          case "03":
            strReturn.date = strValue.trim();
            break;
          case "04":
            strReturn.time = strValue.trim();
            break;
          case "02":
            strReturn.action = strValue.trim();
            break;
        }
      }
    }
    return strReturn;
  }

  static getTransactionCodeTemplate() {
    return {
      11: 'ผุ้ป่วยนอกทั่วไป สิทธิตนเองและครอบครัว',
      12: 'ผุ้ป่วยนอกทั่วไป สิทธิบุตร 0-7 ปี',
      13: 'ผุ้ป่วยนอกทั่วไป สิทธิคู่สมรสต่างชาติ',
      14: 'ผุ้ป่วยนอกทั่วไป ไม่สามารถใช้บัตรได้'
    } 
  }

  static getTransactionCode(code) {
    const transactionCodeTemplate = Object.keys(Edc.getTransactionCodeTemplate()).map(v=>+v)
    if(transactionCodeTemplate.includes(code)){
      if(code == 11)      return [0x31, 0x31]
      else if(code == 12) return [0x31, 0x32]
      else if(code == 13) return [0x31, 0x33]
      else if(code == 14) return [0x31, 0x34]
      else return []
    }
  }

  /**
   * 
   * @param {Number} code 
   */
  static genPresentationHeaderSale(code){
    // let samplecode = [0x31, 0x30, 0x32, 0x32, 0x30, 0x30, 0x30, 0x1c];
    let TEMPLATE = {
      formateVersion: [0x31],
      requestResponseIndicator: [0x30],
      transactionCode: Edc.getTransactionCode(code),
      responseCode: [0x30, 0x30],
      moreDataIndicator: [0x30],
      fieldSeparator: [0x1c]
    };

    return [
      ...TEMPLATE.formateVersion,
      ...TEMPLATE.requestResponseIndicator,
      ...TEMPLATE.transactionCode,
      ...TEMPLATE.responseCode,
      ...TEMPLATE.moreDataIndicator,
      ...TEMPLATE.fieldSeparator
    ]
  }

  static genPaymentData(price,type) {
    let intPrice     = price.substring(0, price.indexOf(".")).padStart(10, "0").split('', 10).map(value => parseInt('0x3'.concat(value)));
    let decimalPrice = price.substring(price.indexOf(".") + 1).split('', 2).map(value => parseInt('0x3'.concat(value)));
    return [
        ...STRUCTURE_KEY.stx, 
        ...STRUCTURE_KEY.lenght, 
        ...STRUCTURE_KEY.reverseForFurfure, 
        ...Edc.genPresentationHeaderSale(type), 

        ...STRUCTURE_KEY.fieldTypeSale, 
        ...intPrice, 
        ...decimalPrice,

        ...STRUCTURE_KEY.etxLrc, 
    ]
  }

  static genPaymentData2(price,cardNo,type=12) {
    let intPrice     = price.substring(0, price.indexOf(".")).padStart(10, "0").split('', 10).map(value => parseInt('0x3'.concat(value)));
    let decimalPrice = price.substring(price.indexOf(".") + 1).split('', 2).map(value => parseInt('0x3'.concat(value)));
    let cardHex = cardNo.padStart(13, "0").split('', 13).map(value => parseInt('0x3'.concat(value)));
    console.log(cardHex);
    return [
        ...STRUCTURE_KEY.stx, 
        ...STRUCTURE_KEY.lenght, 
        ...STRUCTURE_KEY.reverseForFurfure, 
        ...Edc.genPresentationHeaderSale(type), 

        ...STRUCTURE_KEY.fieldTypeSale, 
        ...intPrice, 
        ...decimalPrice,

        ...STRUCTURE_KEY.fieldTypeSaleChildCard, 
        ...cardHex,

        ...STRUCTURE_KEY.etxLrc, 
    ]
  }

 static genCancelData(code) {
    return [
        ...STRUCTURE_KEY.stx, 
        ...STRUCTURE_KEY.lenght, 
        ...STRUCTURE_KEY.reverseForFurfure, 
        ...STRUCTURE_KEY.presentationHeaderCancel, 
        ...STRUCTURE_KEY.fieldTypeCancel, 
        ...code.padStart(6, "0").split('', 6).map(value => parseInt('0x3'.concat(value))),
        ...STRUCTURE_KEY.etxLrc, 
    ];
 }

 static genReprintCode(code) {
    return [
        ...STRUCTURE_KEY.stx,
        ...STRUCTURE_KEY.lenght,
        ...STRUCTURE_KEY.reverseForFurfure,
        ...STRUCTURE_KEY.presentationHeaderReprint,
        ...STRUCTURE_KEY.fieldTypeReprint,
        ...code.padStart(6, "0").split('', 6).map(value => parseInt('0x3'.concat(value))),
        ...STRUCTURE_KEY.etxLrc
    ];
 }

 payment(amount, type=11) {
   let msg = Edc.genPaymentData(amount, type)
   this.sendMessage(msg)
 }

 payment2(amount, cardNo, type=12) {
   let msg = Edc.genPaymentData2(amount, cardNo, type)
   this.sendMessage(msg)
 }

 cancel(code) {
  let msg = Edc.genCancelData(code)
  this.sendMessage(msg)
 }

 reprint(code) {
  let msg = Edc.genReprintCode(code)
  this.sendMessage(msg)
 }

}

module.exports = Edc;
