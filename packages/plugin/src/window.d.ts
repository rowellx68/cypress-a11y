import * as axe from 'axe-core';

declare global {
  interface Window {
    axe: typeof axe;
  }
}
