import { DISCLAIMER } from '../lib/text.ts';

export function Disclaimer() {
  return (
    <p className="disclaimer">
      <strong>Important:</strong> {DISCLAIMER}
    </p>
  );
}
