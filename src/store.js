const Store = require('electron-store');

const schema = {
    settingData: {
        mqtt: {
            host: '',
            username: '',
            password: ''
        },
        mysql: {
            host: '',
            username: '',
            password: '',
            database: '',
        },
        edc: {
            port: '',
            location: '',
            baudrate: '',
            parity: '',
            stopbits: '',
            databits: ''
        }
    }
};

class DataStore extends Store {

    constructor(settings) {
        super(settings)
        this.getSetting();
    }

    initSetting(){
        this.set('settingData', {
            mqtt: {
                host: '',
                username: '',
                password: ''
            },
            mysql: {
                host: '',
                username: '',
                password: '',
                database: '',
            },
            edc: {
                port: '',
                location: 1,
                baudrate: 9600,
                parity: 'none',
                stopbits: 1,
                databits: 8
            }
        });
    }

    getSetting(){
        this.settingData = this.get('settingData');
        if(typeof(this.settingData) === 'undefined'){
            this.initSetting();
        }
        return this.settingData;
    }

    saveSetting(data) {
        this.set('settingData', data)
    }
}

module.exports =  new DataStore({schema})