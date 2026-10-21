/**
 * A small label naming the framework a section belongs to, so Essential Eight results and
 * ASD Essentials content are never confused (methodology D38). The text is the label; the filled
 * or outlined style is only an extra cue.
 */
export function FrameworkTag({ framework }: { framework: 'e8' | 'essentials' }) {
  return framework === 'e8' ? (
    <p className="framework-tag framework-tag--e8">Essential Eight</p>
  ) : (
    <p className="framework-tag framework-tag--essentials">ASD Essentials</p>
  );
}
