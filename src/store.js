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
            }
        });
    }

    getSetting(){
        this.settingData = this.get('settingData');
        if(this.settingData === undefined){
            this.initSetting();
        }
        return this.settingData;
    }

    saveSetting(data) {
        this.set('settingData', data)
    }
}

module.exports =  new DataStore({schema})