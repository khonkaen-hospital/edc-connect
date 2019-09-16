const serialport = require("serialport");
const bsplit = require("buffer-split");
const path      = require('path')

class Edc {
    constructor(){
        this.isConnect = false;
    }

    connect(config = {portName, baudRate, parity, stopBits, dataBits}) {

        this.port = new serialport(config.portName, {
          baudRate: +config.baudRate,
          parity: config.parity,
          stopBits: +config.stopBits,
          dataBits: +config.dataBits
        });
    
        // this.port.on("open", function() {
        //     this.isConnect = true;
        //     console.log('edc connect.');
        // });
      
        // this.port.on("error", function(err) {
        //   console.error(err.message);
        // });
      
        // this.port.on("close", function() {
        //   console.info("Close Connect");
        // });
      
        // this.port.on("data", function(data) {
        //   var buffer = new Buffer(data);
        //   console.log(buffer.toString);
        // });

        return this.port;
    }

    static getEdcSerialport() {
        /**************************************
           serialport.list().then(ports => {
             console.log(ports.find(port => port.manufacturer == 'VeriFone Inc'));
           }) 
        ***************************************/
        return new Promise((resolve, reject) => {
            serialport.list().then((ports) => {
                let data = ports
                .filter(value => value.manufacturer !== undefined)
                .map(port => { return { id: port.comName, label: port.comName + ", " + port.manufacturer};})
                resolve(data)
            })
        })
    }

    sendMessage(price, msg) {
        var buffer = new Buffer(genMessage(price, msg));
        console.log(buffer.toString());
        globlePort.write(buffer, function(err) {
          if (err) {
            //log.error(err.message);
            return console.log("Error on write: ", err.message);
          }
          //log.info("buffer send complte");
        });
    }

    genMessage(price, msg) {
        let intPrice = null,
          decimalPrice = null;
        // let msg = [0x02, 0x00, 0x35, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x30,
        //   0x31, 0x31, //31,31 read card | 32,36 cancel read card | 39,32 re-print
        //   0x30, 0x30, 0x30, 0x1C, 0x34, 0x30, 0x00, 0x12];
      
        //0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x33, 0x32, 0x35, 0x31, 0x37, 0x35  //price 12 digits , 1C end line no price
        intPrice = price.substring(0, price.indexOf(".")).padStart(10, "0");
        decimalPrice = price.substring(price.indexOf(".") + 1);
        for (let i = 0; i < 10; i++) {
          msg.push("0x3".concat(intPrice[i]));
        }
        for (i = 0; i < 2; i++) {
          msg.push("0x3".concat(decimalPrice[i]));
        }
        msg.push(0x1c, 0x03, 0x14);
        return msg;
      }
    checkResponseBuffer(data) {
        strReturn = new Object();
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
          //log.warn("strReceive", strReturn);
          return strReturn;
        } else {
          return "error";
        }
      }
}

module.exports = Edc