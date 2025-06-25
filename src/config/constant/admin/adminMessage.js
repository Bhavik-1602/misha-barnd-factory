// Message constants used across the application
export const MESSAGES = {
  // Validation and General
  VALIDATION_ERROR: "Please provide all required fields.",
  SERVER_ERROR: "Server error occurred. Please try again later.",

  // Registration
  EMAIL_EXISTS: "This email is already registered.",
  REGISTER_SUCCESS: "Registration successful.",

  // Login
  INVALID_CREDENTIALS: "Invalid credentials or account is deactivated.",
  LOGIN_SUCCESS: "Login successful.",

  // Password Reset
  ADMIN_NOT_FOUND: "No admin found with this email.",
  RESET_EMAIL_SENT: "Password reset email sent successfully.",
  EMAIL_FAILED: "Email could not be sent.",
  TOKEN_INVALID: "Invalid or expired token.",
  RESET_SUCCESS: "Password reset successful.",

  // Password Change
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect.",
  PASSWORD_CHANGED: "Password changed successfully.",
};
