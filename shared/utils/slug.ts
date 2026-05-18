const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function randomSlug(len = 10): string {
  let result = '';
  for (let i = 0; i < len; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}
