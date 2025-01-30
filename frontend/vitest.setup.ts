import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    query: {},
  }),
}));

// Mock Next.js image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { src: props.src, alt: props.alt });
  },
}));

// Mock Next.js link
vi.mock('next/link', () => ({
  __esModule: true,
  default: (props: any) => {
    return React.createElement('a', { href: props.href }, props.children);
  },
})); 