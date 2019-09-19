
const moment = require("moment");

class Db {

    constructor(config){
        this.error = undefined;
        this.connect(config)
    }

    connect (config = { host, username, password, database}) {
        this.knex = require('knex') ({
            client: 'mysql',
            connection: {
              host : config.host,
              user : config.username,
              password : config.password,
              database : config.database
            },
            pool: { 
                min: 0, 
                max: 10,
                afterCreate: (conn, done) => {
                    conn.query('SET NAMES UTF8', (err) => {
                      done(err, conn);
                    });
                }
            },
            debug: true,
            acquireConnectionTimeout: 5000
        });
    }

    async saveLog(data={edc_id,type,date,message}) {
        return await this.knex('edc_logs').insert(data);
    }

    async getEdcApproveToDay(edcId, status = 1) {
        return await this.knex('edc_approve')
        .whereRaw('date(datetime) = ? and edc_id = ? and status = ?',[moment().format('YYYY-MM-DD'),edcId, status])
        .orderBy('id','desc');
    }
    
    async getEdcApproveByDate(edcId, date) {
        return await this.knex('edc_approve')
        .whereRaw('date(datetime) = ? and edc_id = ?',[date, edcId])
        .orderBy('datetime','DESC');
    }

    async getSummary(edcId, date) {
        return await this.knex('edc_approve')
        .select(
        this.knex.raw('sum(if(action=\'APPROVED\',amount,0)) as amount'),
        this.knex.raw('count(id) as total'),
        this.knex.raw('sum(if(action=\'APPROVED\',1,0)) as approve'),
        this.knex.raw('sum(if(action=\'APPROVED\',0,1)) as cancel'))
        .whereRaw('date(datetime) = ? and edc_id = ?',[date, edcId]);
    }
    
    async saveEdcApprove(data = {edc_id,action,approve_code, trace, amount, date,message}) {
        return await this.knex('edc_approve').insert(data);
    }
    
    async getEdcLocations() {
        return await this.knex('edc_location').orderBy('location_name','ASC');
    }

    async checkIsConnection() {
        try {
            await this.knex.raw('select 1+1 as result');
            return true;
        } catch (error) {
            this.error = error.message
            return false;
        }
    }
}

module.exports =  Db