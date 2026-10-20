/**
 * Saves text as a file on the user's device. Nothing is uploaded: the file is built in the
 * browser and handed to the browser's own download mechanism.
 */
export function downloadText(filename: string, text: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Today's date as YYYY-MM-DD in the user's local time zone, for file names. */
export function localDateStamp(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
