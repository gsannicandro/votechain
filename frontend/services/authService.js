import api from '../lib/api';

const authService = {
    async requestOtp(email) {
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return { success: false, msg: "Inserisci un'email valida." };
        }

        try {
            await api.post('/api/auth/request-otp', { email });
            return { success: true, msg: 'Codice inviato! Controlla la tua email.' };
        } catch (error) {
            return { 
                success: false, 
                msg: error.message || "Errore durante l'invio del codice." 
            };
        }
    },

    async verifyOtpAndSign(email, otp) {
        if (!email || !otp) {
            return { success: false, msg: "Email e codice sono obbligatori." };
        }

        try {
            const data = await api.post('/api/auth/otp-verify', { 
                email, 
                code: otp 
            });

            return { 
                success: true, 
                msg: 'Accesso effettuato!', 
                ...data
            };
        } catch (error) {
            return { 
                success: false, 
                msg: error.message || "Codice non valido o errore richiesta." 
            };
        }
    }
};

export default authService;
