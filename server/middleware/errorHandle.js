function errorHandler(err, req, res, next) {
    console.log('[Error]', err.name || 'Error', '-', err.message);
    
    switch (err.name) {
        // Authentication errors
        case "not-authentic":
        case "Unauthorized":
            return res.status(401).json({ 
                success: false,
                message: err.message || 'Unauthorized' 
            });
        
        case "email-password invalid":
        case "InvalidCredentials":
            return res.status(401).json({ 
                success: false,
                message: err.message || 'Email atau password salah' 
            });
        
        case "JsonWebTokenError":
            return res.status(401).json({ 
                success: false,
                message: 'Token tidak valid' 
            });
        
        case "TokenExpiredError":
            return res.status(401).json({ 
                success: false,
                message: 'Token sudah expired' 
            });
        
        // Authorization errors
        case "Forbidden":
        case "forbiden":
            return res.status(403).json({ 
                success: false,
                message: err.message || 'Forbidden' 
            });
        
        // Not found errors
        case "NotFound":
        case "not-found":
            return res.status(404).json({ 
                success: false,
                message: err.message || 'Data tidak ditemukan' 
            });
        
        // Validation errors
        case "BadRequest":
            return res.status(400).json({ 
                success: false,
                message: err.message || 'Bad request' 
            });
        
        // Sequelize errors
        case "SequelizeValidationError":
            return res.status(400).json({ 
                success: false,
                message: err.errors[0]?.message || 'Validation error' 
            });
        
        case "SequelizeUniqueConstraintError":
            return res.status(400).json({ 
                success: false,
                message: err.errors[0]?.message || 'Data sudah ada' 
            });
        
        case "SequelizeForeignKeyConstraintError":
            return res.status(400).json({ 
                success: false,
                message: 'Referensi data tidak valid' 
            });
        
        // Default - Internal server error
        default:
            return res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
    }
}

module.exports = errorHandler;
