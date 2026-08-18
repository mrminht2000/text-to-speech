/**
 * Client-Side Double-Hashing helper.
 * Hashes raw password using SHA-256 + Application Salt before network transmission
 * to prevent plain-text exposure in transit or network logs.
 */
export async function hashClientPassword(rawPassword: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`minhtts_salt_${rawPassword}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
