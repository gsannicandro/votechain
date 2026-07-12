import { z } from 'zod';
import { handleCors } from '../../../lib/cors';
import { handleApiError, ApiError } from '../../../lib/api-utils';
import authService from '../../../services/authService_Admin';

// Input validation schema
const loginSchema = z.object({
  identifier: z
    .string({
      required_error: "L'email è obbligatoria",
      invalid_type_error: "L'email non è valida",
    })
    .trim()
    .min(1, "L'email è obbligatoria")
    .max(255, "L'email è troppo lunga"),
  privateKey: z
    .string({
      required_error: 'Chiave privata è obbligatoria',
      invalid_type_error: 'Chiave privata non valida',
    })
    .min(1, 'La Password è obbligatoria')
    .max(255, 'La Password è troppo lunga'),
});

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Only POST allowed
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return handleApiError(res, new ApiError('Metodo non consentito', 405));
  }

  try {
    // Validate input
    const parsedBody = loginSchema.safeParse(req.body);
    if (!parsedBody.success) {
       throw parsedBody.error;
    }
    
    const { identifier, privateKey } = parsedBody.data;

    // Attempt login via service
    const result = await authService.login(identifier, privateKey);
    return res.status(200).json(result);
    
  } catch (error) {
    return handleApiError(res, error);
  }
}
