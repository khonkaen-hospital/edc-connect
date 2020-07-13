
const moment = require("moment");

class Db {

    constructor(config) {
        this.knex = undefined;
        this.visitTableName = undefined;
        this.error = undefined;
        this.config = config;
    }

    connect() {
        let config = this.config;
        this.visitTableName = config.visitTableName;
        this.knex = require('knex')({
            client: 'mysql',
            connection: {
                host: config.host,
                user: config.username,
                password: config.password,
                database: config.database
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

    async getVisitByHn(hn, curentDate = undefined) {
        if (curentDate == undefined) {
            curentDate = moment().format('YYYY-MM-DD')
        }
        return await this.knex(this.visitTableName)
            .where('hn', hn)
            .where('date', curentDate) //cureent date
            .groupBy('vn')
            .orderBy('time', 'DESC');
    }

    async getVisitVn(vn) {
        return await this.knex(this.visitTableName)
            .where('vn', vn).first();
    }

    async getIpdByHn(hn, curentDate = undefined) {
        return await this.knex('view_ipd_ipd')
            .where('hn', hn)
            .orderBy('admite', 'DESC')
            .limit(1);
    }

    async getEdcApproveByID(id) {
        return await this.knex('edc_approve')
            .where('id', id);
    }

    async getPriceAmount(vn) {
        return await this.knex(this.visitTableName)
            .where('vn', vn);
    }

    async getPriceIpd(an) {
        return await this.knex('ipd_charge_item')
            .select(this.knex.raw('sum(price) as total'))
            .where({ an: an, item: 47 })
            .first();
    }

    async checkIsPayment(vn) {
        return await this.knex('edc_approve')
            .whereIn('vn', vn)
            .whereRaw('date(datetime) = ? and status = 1 and type ="PAYMENT" ', moment().format('YYYY-MM-DD'));
    }

    async updateStatus(edc_id, data) {
        return await this.knex('edc_approve').where('id', edc_id).update(data);
    }

    async saveLog(data = { edc_id, type, date, message }) {
        return await this.knex('edc_logs').insert(data);
    }

    async getEdcRoles() {
        return await this.knex('edc_roles').where({ status: 1 }).orderBy('order', 'ASC');
    }

    async getEdcApproveToDay(edcId, status = 1) {
        return await this.knex('edc_approve')
            .whereRaw('date(datetime) = ? and edc_id = ? and status = ?', [moment().format('YYYY-MM-DD'), edcId, status])
            .orderBy('id', 'desc');
    }

    async getEdcApproveByDate(edcId, date) {
        return await this.knex('edc_approve')
            .whereRaw('date(datetime) = ? and edc_id = ?', [date, edcId])
            .orderBy('id', 'DESC');
    }

    async getSummary(edcId, date) {
        return await this.knex('edc_approve')
            .select(
                this.knex.raw('sum(if((status=1 && type=\'PAYMENT\'),amount,0)) as amount'),
                this.knex.raw('sum(if((type=\'PAYMENT\' && status in (0,1)),1,0)) total'),
                this.knex.raw('sum(if((status=1 && type=\'PAYMENT\'),1,0)) as approve'),
                this.knex.raw('sum(if((status=1 && type=\'CANCEL\'),1,0)) as cancel'))
            .whereRaw('date(datetime) = ? and edc_id = ?', [date, edcId]);
    }

    async saveEdcApprove(data = { edc_id, action, approve_code, trace, amount, date, message }) {
        return await this.knex('edc_approve').insert(data);
    }

    async getEdcLocations() {
        return await this.knex('edc_location').orderBy('location_name', 'ASC');
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

module.exports = Db