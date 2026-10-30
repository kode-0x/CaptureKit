import { CaptureStore } from '../features/network-capture/store';
const capture = new CaptureStore();
chrome.devtools.network.onRequestFinished.addListener(capture.accept);
chrome.devtools.panels.create(
  'CaptureKit',
  'icons/icon32.png',
  'panel.html',
  (panel) => {
    panel.onShown.addListener((win) => {
      const target = win as Window;
      target.__capturekit = capture;
      target.dispatchEvent(new Event('capturekit-ready'));
    });
  },
);
