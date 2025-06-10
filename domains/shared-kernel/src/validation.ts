import { z } from 'zod';

// Query parameter validation schemas
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val)) : 1),
  limit: z.string().optional().transform(val => val ? Math.max(1, Math.min(100, parseInt(val))) : 20),
});

export const idParamSchema = z.object({
  id: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid ID parameter');
    }
    return num;
  })
});

export const emailSchema = z.string().email().max(255);
export const passwordSchema = z.string().min(8).max(128);
export const usernameSchema = z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/);

// Contact form validation
export const contactFormSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: emailSchema,
  subject: z.string().max(200).trim().optional(),
  message: z.string().min(10).max(2000).trim(),
});

// Authentication validation
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema.optional(),
  displayName: z.string().max(100).trim().optional(),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const confirmResetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().min(6).max(10),
  newPassword: passwordSchema,
});

// Workflow validation
export const workflowStatusSchema = z.enum(['active', 'paused', 'error', 'draft']);
export const iconColorSchema = z.enum(['indigo', 'green', 'amber', 'rose', 'sky', 'purple', 'default']);

// App status validation
export const appStatusSchema = z.enum(['connected', 'disconnected', 'error']);