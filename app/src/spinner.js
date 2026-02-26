import { Spinner } from 'spin.js';
import 'spin.js/spin.css';

const spinner = new Spinner({ lines: 9, radius: 7, length: 7 });
let spinnerTimeout = null;
const spinnerThresholdMs = 100;

export function showSpinner() {
  if (spinnerTimeout == null) {
    const target = document.getElementById('spinner');
    spinnerTimeout = setTimeout(() => spinner.spin(target), spinnerThresholdMs);
  }
}

export function hideSpinner() {
  if (spinnerTimeout != null) clearTimeout(spinnerTimeout);
  spinner.stop();
  spinnerTimeout = null;
}
