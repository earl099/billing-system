import { z } from 'zod'

/**
 * Validation schemas for request body validation
 * Used with validate middleware to ensure data integrity
 */

// Auth schemas
export const signupSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
    username: z.string().min(3, 'Username must be 3+ characters').max(50, 'Username too long').toLowerCase().trim(),
    email: z.string().email('Invalid email format').toLowerCase().trim(),
    password: z.string().min(8, 'Password must be 8+ characters').max(100, 'Password too long')
})

export const loginSchema = z.object({
    identifier: z.string().min(1, 'Username or email required').trim(),
    password: z.string().min(1, 'Password required')
})

// Client schemas
export const createClientSchema = z.object({
    code: z.string().min(1, 'Code required').max(20, 'Code too long').toUpperCase().trim(),
    name: z.string().min(1, 'Name required').max(100, 'Name too long').trim(),
    payFreq: z.string().min(1, 'Pay frequency required')
})

export const updateClientSchema = z.object({
    name: z.string().min(1, 'Name required').max(100, 'Name too long').trim().optional(),
    payFreq: z.string().min(1, 'Pay frequency required').optional()
}).strict()

// Billing schemas
export const generateBillingSchema = z.object({
    code: z.string().min(1, 'Code required'),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2000).optional()
})

// User schemas
export const createUserSchema = z.object({
    name: z.string().min(1, 'Name required').max(100, 'Name too long').trim(),
    username: z.string().min(3, 'Username must be 3+ characters').max(50, 'Username too long').trim(),
    email: z.string().email('Invalid email').toLowerCase().trim(),
    password: z.string().min(8, 'Password must be 8+ characters').max(100, 'Password too long'),
    role: z.enum(['Admin', 'User']).optional()
})

export const updateUserSchema = z.object({
    name: z.string().min(1, 'Name required').max(100, 'Name too long').trim().optional(),
    username: z.string().min(3, 'Username must be 3+ characters').max(50, 'Username too long').trim().optional(),
    email: z.string().email('Invalid email').toLowerCase().trim().optional(),
    password: z.string().min(8, 'Password must be 8+ characters').max(100, 'Password too long').optional(),
    role: z.enum(['Admin', 'User']).optional(),
    handledClients: z.array(z.string()).optional()
}).strict()

// Pay frequency schemas
export const createPayFreqSchema = z.object({
    payType: z.string().min(1, 'Pay type required').max(50, 'Pay type too long').trim()
})

// Log schemas
export const createLogSchema = z.object({
    action: z.string().min(1, 'Action required').max(200, 'Action too long').trim(),
    details: z.string().max(500, 'Details too long').optional()
})

// Billing Rate schemas
export const createBillingRateSchema = z.object({
    posCode: z.string().min(1, 'Position code required').max(50, 'Position code too long').trim(),
    posName: z.string().min(1, 'Position name required').max(100, 'Position name too long').trim(),
    salaryWage: z.number().positive('Salary wage must be positive'),
    dailyRate: z.number().positive('Daily rate must be positive'),
    monthlyRate: z.number().positive('Monthly rate must be positive'),
    semiMonthlyRate: z.number().positive('Semi-monthly rate must be positive')
})
