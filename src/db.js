
const moment = require("moment");

class Db {

    constructor(config){
        this.error = undefined;
        this.connect(config)
    }

    connect (config = { host, username, password, database}) {
        this.knex = require('knex')({
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