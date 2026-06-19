/**
 * @fileoverview Winston logger configuration
 * Provides a centralized logging instance with multiple transports and severity levels
 * Logs to console and rotating files with structured formatting
 */

import winston from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {string} Directory path for log files */
const logDir = path.join(__dirname, '../logs')

/**
 * Log severity levels (lower number = higher priority)
 * @type {Object<string, number>}
 */
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
}

/**
 * Console color mappings for log levels
 * @type {Object<string, string>}
 */
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
}

winston.addColors(colors)

/**
 * Log format configuration
 * Combines timestamp, error stack traces, and custom printf formatting
 */
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

/**
 * Logger transport configuration
 * - Console: All log levels
 * - error.log: Error-level logs only (5MB rotation, 5 files)
 * - combined.log: All log levels (5MB rotation, 5 files)
 * - audit.log: Security and audit events at warn level (5MB rotation, 10 files)
 */
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

/**
 * Winston logger instance
 * Configured with custom levels, formatting, and transports.
 * Includes handlers for uncaught exceptions and unhandled promise rejections.
 * 
 * @type {import('winston').Logger}
 * 
 * @example
 * import logger from './logger.util.js'
 * logger.info('User logged in', { userId: '123' })
 * logger.error('Database error', { error: err.message })
 */
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
