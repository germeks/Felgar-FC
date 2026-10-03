/**
 * Birthday and age utility functions for Felgar FC players
 */

export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const parts = birthDate.split('-');
  if (parts.length < 3) return 0;
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);
  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = today.getMonth() - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
    age--;
  }
  return Math.max(0, age);
};

export const isBirthdayToday = (birthDate?: string): boolean => {
  if (!birthDate) return false;
  const parts = birthDate.split('-');
  if (parts.length < 3) return false;
  const birthMonth = parseInt(parts[1], 10);
  const birthDay = parseInt(parts[2], 10);
  if (isNaN(birthMonth) || isNaN(birthDay)) return false;

  const today = new Date();
  return today.getMonth() + 1 === birthMonth && today.getDate() === birthDay;
};

export const getDaysUntilBirthday = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  const parts = birthDate.split('-');
  if (parts.length < 3) return null;
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);
  if (isNaN(birthMonth) || isNaN(birthDay)) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisYearBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
  thisYearBirthday.setHours(0, 0, 0, 0);

  if (thisYearBirthday.getTime() === today.getTime()) {
    return 0;
  }

  if (thisYearBirthday.getTime() < today.getTime()) {
    const nextYearBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
    const diffTime = nextYearBirthday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else {
    const diffTime = thisYearBirthday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
};

export const formatBirthDate = (birthDate?: string, includeYear: boolean = true): string => {
  if (!birthDate) return '';
  try {
    const parts = birthDate.split('-');
    if (parts.length < 3) return birthDate;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);

    if (includeYear) {
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  } catch {
    return birthDate;
  }
};

/**
 * Converts ISO "YYYY-MM-DD" to user-friendly Spanish format "DD/MM/YYYY"
 */
export const isoToDisplayDate = (iso?: string): string => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  const [year, month, day] = parts;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

/**
 * Formats a raw user input string with slashes as DD/MM/AAAA while typing
 */
export const formatBirthDateInput = (val: string): string => {
  // If user already typed with slashes or dashes, preserve them cleanly
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

/**
 * Validates and converts flexible user input (e.g. DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
 * to standard ISO YYYY-MM-DD
 */
export const parseFlexibleDateToIso = (input: string): string | null => {
  if (!input) return null;
  const clean = input.trim();

  // Match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    const currentYear = new Date().getFullYear();

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1920 && year <= currentYear) {
      // Basic calendar validity check (days in month)
      const maxDays = new Date(year, month, 0).getDate();
      if (day <= maxDays) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    return null;
  }

  // Match YYYY-MM-DD
  const ymdMatch = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    const currentYear = new Date().getFullYear();

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1920 && year <= currentYear) {
      const maxDays = new Date(year, month, 0).getDate();
      if (day <= maxDays) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    return null;
  }

  return null;
};
