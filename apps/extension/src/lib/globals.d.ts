import type { CaptureBridge } from '../features/network-capture/store';
declare global {
  interface Window {
    __capturekit?: CaptureBridge;
  }
}
