const errorMap = new Map<string, string>([
  ["auth/email-already-in-use", "Email already in use."],
  ["auth/invalid-email", "Invalid email address."],
  ["Invalid login credentials", "Invalid email or password."],
  ["Email not confirmed", "Email not confirmed. Please check your inbox."],
]);

export const getErrorMessage = (errorCode: string): string => {
  return errorMap.get(errorCode) || "An unknown error occurred.";
};