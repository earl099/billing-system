import dotenv from 'dotenv'

if(process.env.NODE_ENV === 'production') {
    try {
        dotenv.config()
    } catch (error) {
        console.warn('dotenv is not installed. Environment variables will be loaded from process.env only.')
    }
}

const env = process.env.NODE_ENV || 'development'

const common = {
    PORT: process.env.PORT || 3000
}

const environments = {
    development: {
        MONGODB_URI: 'mongodb+srv://earlsaturay09:Lbrdc2021.@billing-system.j1yrr.mongodb.net/billing-system-db',
        JWT_SECRET: 'your_secret_here',
        JWT_EXPIRATION: '1h',
        CORS_ORIGIN: '*'
    },
    production: {
        MONGODB_URI: process.env.MONGODB_URI,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1h',
        CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    },
    test: {
        MONGODB_URI: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/test',
        JWT_SECRET: 'test_secret',
        JWT_EXPIRATION: '1h',
        CORS_ORIGIN: '*',
    }
}

const config = {
    ...common,
    ...environments[env],
    ENV: env
}

export default config