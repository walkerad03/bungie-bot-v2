const mysql = require('mysql');
const Logger = require('../logger');
const config = require("../../../config.json");

const logger = new Logger();

class Database {
    constructor() {
        const { host, port, user, password, database} = config.database;

        this.connection = mysql.createConnection({
            host: host,
            user: user,
            password: password,
            database: database
        });

        logger.logInfo(`Connected to database ${database}.`);

        this.connection.query(`CREATE DATABASE IF NOT EXISTS ${database};`);

        logger.logInfo("Database configured.");
    }

    createTable(table_name, schema) {
        this.connection.query(`SELECT * FROM information_schema.tables WHERE table_schema = 'mydb' AND table_name = '${table_name}' LIMIT 1;`, function (err, result) {
            if (err) {
                logger.logError("Database query failed", err);
                throw err;
            }
            
            if (result.length > 0) {
                logger.logWarn(`Table ${table_name} already exists`);
                return;
            }
    
            this.connection.query(`CREATE TABLE ${table_name} ${schema}`, function (err, result) {
                if (err) {
                    logger.logError("Database query failed", err);
                    throw err;
                }
        
                logger.logInfo(result);
            });
        });
    }

    queryDB(query) {
        this.connection.query(query, function (err, result) {
            if (err) {
                logger.logError("Database query failed", err);
                throw err;
            }

            return result;
        });
    }
}


module.exports = Database;