/**
 * Conversation Identifier Domain Logic
 * 
 * Pure functions for generating and managing conversation partner identifiers.
 * Identifiers follow the pattern: #MMDDHHHH (timestamp + 4 random letters)
 * Example: #0910ABCD (09月10日 + ABCD)
 */

/**
 * Generate a new identifier with timestamp + 4 random letters
 * 
 * @returns Identifier in format #MMDDHHHH (e.g., #0910ABCD)
 * 
 * @example
 * generateNextIdentifier() // '#0910ABCD'
 * generateNextIdentifier() // '#0910XYZW'
 */
export function generateNextIdentifier(_currentIdentifiers?: string[]): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = `${month}${day}`;
  
  // Generate 4 random uppercase letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomLetters = '';
  for (let i = 0; i < 4; i++) {
    randomLetters += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  return `${timestamp}${randomLetters}`;
}

/**
 * Validate an identifier format
 * 
 * @param identifier - Identifier to validate (e.g., '0910ABCD')
 * @returns True if valid (MMDD + 4 uppercase letters)
 * 
 * @example
 * validateIdentifier('0910ABCD') // true
 * validateIdentifier('1231XYZW') // true
 * validateIdentifier('A') // false
 * validateIdentifier('0910ABC') // false (only 3 letters)
 */
export function validateIdentifier(identifier: string): boolean {
  return /^\d{4}[A-Z]{4}$/.test(identifier);
}

/**
 * Format identifier for display (with # prefix)
 * 
 * @param identifier - Raw identifier (e.g., '0910ABCD')
 * @returns Formatted identifier (e.g., '#0910ABCD')
 */
export function formatIdentifier(identifier: string): string {
  return `#${identifier}`;
}

/**
 * Parse identifier from user input (remove # prefix if present)
 * 
 * @param input - User input (e.g., '#0910ABCD' or '0910ABCD')
 * @returns Clean identifier (e.g., '0910ABCD')
 */
export function parseIdentifier(input: string): string {
  return input.replace(/^#/, '').toUpperCase();
}

