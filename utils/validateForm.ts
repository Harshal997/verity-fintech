export const validateEmail = (email: string) => {
  if (!email) return "Email is required";
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return "Invalid email format";
  return "";
};

export const validateFullName = (name: string) => {
  if (!name) return "Full name is required";
  if (name.length < 3) return "Too short";
  return "";
};

export const validateMobile = (number: string) => {
  if (!number) return "Mobile number is required";
  if (!/^\d{10}$/.test(number)) return "Must be 10 digits";
  return "";
};

export const validatePassword = (password: string) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Minimum 6 characters";
  return "";
};
