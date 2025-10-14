import { verify } from 'jsonwebtoken';
import { createError } from './error-utils.js';
import { JWT_SECRET } from '../config/env.js';

const authCheck = (req, res, next) => {
  try {
    // Check if the authorization header exists
    if (!req.headers.authorization) {
      throw createError("Authentication required", 401);
    }

    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      throw createError("Authentication required", 401);
    }

    const decodedToken = verify(token, JWT_SECRET);
    req.userData = { email: decodedToken.email, userId: decodedToken.userId };
    next();
  } catch (error) {
    // If it's already a custom error, pass it along
    if (error.statusCode) {
      next(error);
    } else {
      // Handle JWT specific errors
      let message = "Authentication failed";
      if (error.name === "JsonWebTokenError") {
        message = "Invalid token";
      } else if (error.name === "TokenExpiredError") {
        message = "Token expired";
      }
      next(createError(message, 401));
    }
  }
}


export default authCheck 