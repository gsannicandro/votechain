import bcrypt from 'bcryptjs';
import adminDAO from '../repositories/adminDAO';
import tokenService from '../lib/tokenService';
import { ApiError } from '../lib/api-utils';

export const authServiceAdmin = {
    
    async login(identifier, privateKey) {
        const admin = await adminDAO.findByUsername(identifier);

        if (!admin) {
            throw new ApiError('Credenziali non valide.', 401);
        }

        const storedSecret = admin.password_hash || '';
        let isValidSecret = false;

        // Support both bcrypt and plaintext
        if (storedSecret.startsWith('$2')) {
            isValidSecret = await bcrypt.compare(privateKey, storedSecret);
        } else {
            isValidSecret = storedSecret === privateKey;
        }

        if (!isValidSecret) {
            throw new ApiError('Credenziali non valide.', 401);
        }

        // Generate JWT using centralized token service
        const token = tokenService.generateToken({
            sub: admin.id,
            username: admin.username,
        });

        const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

        return {
            token,
            expiresIn,
            admin: {
                id: admin.id,
                username: admin.username,
            },
        };
    }
};

export default authServiceAdmin;
