import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// URL mock for Blob in JSDOM
globalThis.URL.createObjectURL = (blob: Blob) => `blob:${blob.size}`;
globalThis.URL.revokeObjectURL = () => {};

afterEach(() => {
  cleanup();
});
