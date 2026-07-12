import { ApiError, handleApiError } from '../lib/api-utils';

export function rateLimit({ windowMs, max }) {
    const trackers = new Map();

    // Periodic cleanup to prevent memory leaks
    const interval = setInterval(() => {
        const now = Date.now();
        for (const [ip, data] of trackers.entries()) {
            if (now - data.timestamp > windowMs) {
                trackers.delete(ip);
            }
        }
    }, windowMs);

    // Allow process to exit even if this interval is running
    if (interval.unref) interval.unref();

    return function (req, res, next) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const now = Date.now();

        const record = trackers.get(ip) || { timestamp: now, count: 0 };

        // Reset if window passed since start of record
        if (now - record.timestamp > windowMs) {
            record.timestamp = now;
            record.count = 0;
        }

        record.count++;
        trackers.set(ip, record);

        if (record.count > max) {
            const error = new ApiError('Too many requests, please try again later.', 429);
            
            // If used in Next.js API Routes / Express
            if (res && typeof res.status === 'function') {
                return handleApiError(res, error);
            }
            
            // Fallback for manual invocation without res
            return { error: true, status: 429, message: error.message };
        }

        if (next && typeof next === 'function') {
            return next();
        }

        return null;
    };
}
