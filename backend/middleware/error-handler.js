const errorHandler = (err, req, res, next) => {
  // Default error status and message
  const status = err.statusCode || 500;
  const message = err.message || 'An unknown error occurred!';

  // Log the error for server-side debugging
  // console.error(err);

  // Send error response in the format expected by the frontend
  res.status(status).json({
    message: message
  });
};

export default errorHandler