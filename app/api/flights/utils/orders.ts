import crypto from 'crypto';

// ================================================================
// BOOKING REFERENCE
// Format: FB-YYMMDD-XXXX (e.g. FB-260311-4829)
// ================================================================

export const generateBookingReference = (): string => {
    const now  = new Date();
    const year  = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');
    const rand  = Math.floor(1000 + Math.random() * 9000);
    return `FB-${year}${month}${day}-${rand}`;
};

// ================================================================
// AES-256-CBC ENCRYPTION
//
// ENCRYPTION_KEY must be exactly 32 characters (256 bits).
// Set a 32-char random string in your .env:
//   ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//
// ⚠ If the key is missing or wrong length, encrypt/decrypt
//   will throw clearly instead of silently failing or crashing.
// ================================================================

const RAW_KEY = process.env.ENCRYPTION_KEY ?? '';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
    if (!RAW_KEY) {
        throw new Error(
            '[Encryption] ENCRYPTION_KEY is not set in environment variables.',
        );
    }

    const keyBuf = Buffer.from(RAW_KEY, 'utf8');

    if (keyBuf.length !== 32) {
        throw new Error(
            `[Encryption] ENCRYPTION_KEY must be exactly 32 bytes for AES-256. Got ${keyBuf.length} byte(s). ` +
            `Tip: use a 32-character random string.`,
        );
    }

    return keyBuf;
}

export const encrypt = (text: string): string => {
    if (!text) return '';

    const key    = getEncryptionKey();
    const iv     = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    const encrypted = Buffer.concat([
        cipher.update(Buffer.from(text, 'utf8')),
        cipher.final(),
    ]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decrypt = (text: string): string => {
    if (!text || !text.includes(':')) return '';

    const key   = getEncryptionKey();
    const parts = text.split(':');

    // iv is always the first 32 hex chars (16 bytes)
    const iv            = Buffer.from(parts.shift()!, 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');

    if (iv.length !== IV_LENGTH) return '';

    const decipher  = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([
        decipher.update(encryptedText),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');
};

// ================================================================
// DATE FORMATTER
// Output: "Mar 11, 2026, 10:30 AM"
// ================================================================

export function getShortDateTime(
    dateInput: Date | number | string | null | undefined,
    userTimeZone = 'UTC',
): string {
    if (dateInput === null || dateInput === undefined || dateInput === '') {
        return 'N/A';
    }

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';

    // Guard against invalid timezone strings
    let tz = userTimeZone;
    try {
        Intl.DateTimeFormat(undefined, { timeZone: userTimeZone });
    } catch {
        tz = 'UTC';
    }

    return new Intl.DateTimeFormat('en-US', {
        month:    'short',
        day:      'numeric',
        year:     'numeric',
        hour:     'numeric',
        minute:   '2-digit',
        hour12:   true,
        timeZone: tz,
    }).format(date);
}