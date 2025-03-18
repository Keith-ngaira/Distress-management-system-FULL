// Error handling middleware
export const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);

    // Handle specific error types
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.errors
        });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'Duplicate entry found',
            field: error.message.includes('username') ? 'username' : 
                   error.message.includes('email') ? 'email' : 'unknown'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (error.name === 'NotFoundError') {
        return res.status(404).json({
            success: false,
            message: error.message || 'Resource not found'
        });
    }

    if (error.name === 'ForbiddenError') {
        return res.status(403).json({
            success: false,
            message: error.message || 'Access forbidden'
        });
    }

    // Default error response
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
};

// Custom error classes
export class ValidationError extends Error {
    constructor(errors) {
        super('Validation error');
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

export class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized access') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends Error {
    constructor(message = 'Access forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
    }
}

// Async handler wrapper
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
