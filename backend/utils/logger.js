const LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
};

const CONTEXTS = {
    SYSTEM: 'SYSTEM',
    AUTH: 'AUTH',
    VOTE: 'VOTE',
    AUDIT: 'AUDIT'
};

function formatMessage(level, context, message, meta = {}) {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
        timestamp,
        level,
        context,
        message,
        ...meta
    });
}

const logger = {
    info: (context, message, meta) => console.log(formatMessage(LEVELS.INFO, context, message, meta)),
    warn: (context, message, meta) => console.warn(formatMessage(LEVELS.WARN, context, message, meta)),
    error: (context, message, meta) => console.error(formatMessage(LEVELS.ERROR, context, message, meta)),

    CONTEXTS
};

export default logger;
