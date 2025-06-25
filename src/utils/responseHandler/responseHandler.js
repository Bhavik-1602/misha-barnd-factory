// src/utils/sendemail/responseHandler/responseHandler.js
import { STATUS } from '../../config/constant/status/status.js';

export const successResponse = (res, message, data, statusCode = STATUS.SUCCESS) => {
  return res.status(statusCode).json({
    success: true,
    message,
    statusCode,
    data,
  });
};

export const errorResponse = (res, message, statusCode = STATUS.BAD_REQUEST) => {
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
};

export { STATUS }; // Only if you still want to export it from here (optional)
