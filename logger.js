const winston = require('winston');

const now = new Date();
const nowString = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json({ space: 2 }),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: `logs/${nowString}-logs.log`,
    }),
  ],
});

module.exports = logger;
