const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging purposes

    const statusCode = err.statusCode || 500; // Default to 500 if no status code is set
    const message = err.message || 'Internal Server Error'; // Default message

    res.status(statusCode).json({
        success: false,
        error: {
            message,
        },
    });
};

module.exports = {
    errorMiddleware,
};
