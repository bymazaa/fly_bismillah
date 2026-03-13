/**
 * Generates a unique, admin-friendly booking reference.
 * Format: MF-YYMMDD-XXXX (e.g., MF-260131-4829)
 */
export const generateBookingReference = (): string => {
  const now = new Date();

  // 1. Date Part: YYMMDD (e.g., 260131)
  const year = now.getFullYear().toString().slice(-2); // 26
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 01
  const day = String(now.getDate()).padStart(2, '0'); // 31
  const dateCode = `${year}${month}${day}`;

  // 2. Random Part: 4 Digits (1000 to 9999)
  const randomCode = Math.floor(1000 + Math.random() * 9000);

  // 3. Combine: MF-260131-1234
  return `FB-${dateCode}-${randomCode}`; //FB- fly bismillash
};



import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ""; 
const IV_LENGTH = 16; 

export const encrypt = (text: string): string => {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string): string => {
  if (!text || !text.includes(':')) return "";
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};


/**
 * Takes a Date object, timestamp, or date string and returns a short, beautiful format.
 * Example Output: "Oct 24, 2023, 10:30 AM"
 */
// utils/dateHelper.ts
export function getShortDateTime(
  dateInput: Date | number | string, 
  userTimeZone: string = 'UTC'
): string {
  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: userTimeZone
  }).format(date);
}