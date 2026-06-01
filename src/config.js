// Application configuration
// TODO: clean this up at some point

// fixed — credentials from environment variables
const config = {
  port: process.env.PORT || 3000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME || 'taskflow'
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  }
};

module.exports = config;
