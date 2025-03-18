import { z } from 'zod';

// Validation middleware using Zod
export const validateRequest = (schemas) => {
    return async (req, res, next) => {
        try {
            if (schemas.params) {
                req.params = await schemas.params.parseAsync(req.params);
            }
            if (schemas.query) {
                req.query = await schemas.query.parseAsync(req.query);
            }
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
};

// User schemas
export const userSchemas = {
    create: z.object({
        username: z.string()
            .min(3, 'Username must be at least 3 characters')
            .max(50, 'Username cannot exceed 50 characters'),
        email: z.string()
            .email('Invalid email format'),
        password: z.string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
        role: z.enum(['admin', 'director', 'front_office', 'cadet'], {
            errorMap: () => ({ message: 'Invalid role' })
        })
    }),
    update: z.object({
        username: z.string()
            .min(3, 'Username must be at least 3 characters')
            .max(50, 'Username cannot exceed 50 characters')
            .optional(),
        email: z.string()
            .email('Invalid email format')
            .optional(),
        role: z.enum(['admin', 'director', 'front_office', 'cadet'], {
            errorMap: () => ({ message: 'Invalid role' })
        }).optional()
    })
};

// Distress message schemas
export const distressMessageSchemas = {
    create: z.object({
        sender_name: z.string()
            .min(1, 'Sender name is required')
            .max(255, 'Sender name cannot exceed 255 characters'),
        subject: z.string()
            .min(1, 'Subject is required')
            .max(255, 'Subject cannot exceed 255 characters'),
        country_of_origin: z.string()
            .min(1, 'Country of origin is required')
            .max(100, 'Country of origin cannot exceed 100 characters'),
        distressed_person_name: z.string()
            .min(1, 'Distressed person name is required')
            .max(255, 'Distressed person name cannot exceed 255 characters'),
        nature_of_case: z.string()
            .min(1, 'Nature of case is required'),
        case_details: z.string()
            .optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent'], {
            errorMap: () => ({ message: 'Invalid priority level' })
        }).optional().default('medium')
    }),
    update: z.object({
        subject: z.string()
            .max(255, 'Subject cannot exceed 255 characters')
            .optional(),
        case_details: z.string()
            .optional(),
        resolution_notes: z.string()
            .optional(),
        status: z.enum(['pending', 'assigned', 'in_progress', 'resolved'], {
            errorMap: () => ({ message: 'Invalid status' })
        }).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent'], {
            errorMap: () => ({ message: 'Invalid priority level' })
        }).optional()
    })
};

// Case update schemas
export const caseUpdateSchemas = {
    create: z.object({
        update_text: z.string()
            .min(1, 'Update text is required')
    }),
    update: z.object({
        update_text: z.string()
            .min(1, 'Update text is required')
    })
};

// Case assignment schemas
export const caseAssignmentSchemas = {
    create: z.object({
        assigned_to: z.number()
            .int('Invalid assignee ID'),
        director_instructions: z.string()
            .optional()
    }),
    update: z.object({
        status: z.enum(['active', 'completed', 'reassigned'], {
            errorMap: () => ({ message: 'Invalid status' })
        })
    })
};

// Attachment schemas
export const attachmentSchemas = {
    upload: z.object({
        file: z.any()
            .refine((file) => file?.size <= 10 * 1024 * 1024, 'File size cannot exceed 10MB')
            .refine(
                (file) => [
                    'image/jpeg',
                    'image/png',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ].includes(file?.mimetype),
                'Invalid file type. Allowed types: JPG, PNG, PDF, DOC, DOCX'
            )
    })
};

// Pagination and sorting schemas
export const commonSchemas = {
    pagination: z.object({
        page: z.number()
            .int('Page must be an integer')
            .min(1, 'Page must be at least 1')
            .optional()
            .default(1),
        limit: z.number()
            .int('Limit must be an integer')
            .min(1, 'Limit must be at least 1')
            .max(100, 'Limit cannot exceed 100')
            .optional()
            .default(10)
    }),
    sorting: z.object({
        sortBy: z.string()
            .regex(/^[a-zA-Z_]+$/, 'Invalid sort field')
            .optional(),
        sortOrder: z.enum(['asc', 'desc'], {
            errorMap: () => ({ message: 'Sort order must be either asc or desc' })
        }).optional()
    })
};
