import { describe, it, expect } from 'vitest';
import { hashClientPassword } from '../utils/crypto';

describe('Client-Side Password Hashing', () => {
  it('should generate consistent SHA-256 hex string with salt', async () => {
    const raw = 'Admin@123456';
    const hash1 = await hashClientPassword(raw);
    const hash2 = await hashClientPassword(raw);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // 64 hex characters for SHA-256
    expect(hash1).not.toBe(raw);
  });

  it('should generate different hashes for different passwords', async () => {
    const hash1 = await hashClientPassword('password123');
    const hash2 = await hashClientPassword('password456');

    expect(hash1).not.toBe(hash2);
  });
});
