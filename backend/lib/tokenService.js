import jwt from 'jsonwebtoken';

// Ensure secret is present
if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is missing in environment variables.');
    }
    console.warn('Warning: JWT_SECRET not set, using insecure default.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'votechain-dev-secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRES_IN || '1h';

class TokenService {

    generateToken(payload, expiresIn = JWT_EXPIRATION) {
        return jwt.sign(payload, JWT_SECRET, { expiresIn });
    }

    verifyToken(token) {
        return jwt.verify(token, JWT_SECRET);
    }

    getDefaultExpiration() {
        return JWT_EXPIRATION;
    }
}

export default new TokenService();
