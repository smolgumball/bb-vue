export function cleanupError(error) {
  return String(error)
    .replace('|DELIMITER|', '')
    .replaceAll('|DELIMITER|', ' » ')
    .replaceAll('<br>', '')
    .replaceAll('Stack:', '')
}
