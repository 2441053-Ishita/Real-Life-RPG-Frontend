/**
 * Authentication and User Input Security Validation Utilities
 */

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  label: "Weak" | "Fair" | "Good" | "Strong";
  color: string;
  errors: string[];
}

export function validateHeroName(name: string): { isValid: boolean; error: string | null; cleanName: string } {
  const cleanName = name.trim();

  if (cleanName.length < 3 || cleanName.length > 20) {
    return {
      isValid: false,
      error: "Hero Name must be between 3 and 20 characters long.",
      cleanName,
    };
  }

  // Prevent malicious HTML / script injection / invalid characters
  const validPattern = /^[a-zA-Z0-9_ ]+$/;
  if (!validPattern.test(cleanName)) {
    return {
      isValid: false,
      error: "Hero Name can only contain letters, numbers, spaces, and underscores.",
      cleanName,
    };
  }

  // Check for common malicious script keywords
  const lower = cleanName.toLowerCase();
  if (
    lower.includes("<script") ||
    lower.includes("javascript:") ||
    lower.includes("select ") ||
    lower.includes("drop ")
  ) {
    return {
      isValid: false,
      error: "Hero Name contains invalid or restricted characters.",
      cleanName,
    };
  }

  return {
    isValid: true,
    error: null,
    cleanName,
  };
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasMinLength) errors.push("At least 8 characters");
  if (!hasUppercase) errors.push("At least one uppercase letter (A-Z)");
  if (!hasLowercase) errors.push("At least one lowercase letter (a-z)");
  if (!hasNumber) errors.push("At least one number (0-9)");
  if (!hasSpecial) errors.push("At least one special character (!@#$%^&*)");

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasUppercase && hasLowercase) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  let label: "Weak" | "Fair" | "Good" | "Strong" = "Weak";
  let color = "#EF4444"; // Red

  if (score === 4) {
    label = "Strong";
    color = "#10B981"; // Green
  } else if (score === 3) {
    label = "Good";
    color = "#F59E0B"; // Yellow/Orange
  } else if (score === 2) {
    label = "Fair";
    color = "#3B82F6"; // Blue
  }

  return {
    isValid: errors.length === 0,
    score,
    label,
    color,
    errors,
  };
}
