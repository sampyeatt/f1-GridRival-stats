import {createLogger, transports, format} from 'winston'

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json(),
        format.printf(({level, message, timestamp, stack})=>{
            return `${timestamp} ${level}: ${message} ${stack ?? ''}`
        })
    ),
    transports: [
        new transports.File({filename: 'error.log', level: 'error'}),
        new transports.Console()
    ]
})

export default logger