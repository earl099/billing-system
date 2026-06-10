import winston from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Winston logger configuration
 * Logs to both console and files with different severity levels
 */

const logDir = path.join(__dirname, '../logs')

// Define log levels and colors
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
}

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
}

winston.addColors(colors)

// Define format for logs
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(
        (info) => {
            const { timestamp, level, message, stack, ...args } = info
            const ts = timestamp.slice(0, 19).replace('T', ' ')
            
            // Include stack trace for errors
            if (stack) {
                return `${ts} [${level}]: ${message} - ${stack}`
            }
            
            return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`
        }
    )
)

// Define transports (where logs are stored)
const transports = [
    // Console transport
    new winston.transports.Console(),
    
    // Error file transport
    new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    
    // Combined file transport
    new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    
    // Audit log for security events
    new winston.transports.File({
        filename: path.join(logDir, 'audit.log'),
        level: 'warn',
        maxsize: 5242880, // 5MB
        maxFiles: 10,
    })
]

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format,
    transports,
    exceptionHandlers: [
        new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
    ]
})

export default logger
