let spinnerTimeout = null;
const spinnerThresholdMs = 100;

export function showSpinner() {
  if (spinnerTimeout == null) {
    spinnerTimeout = setTimeout(() => {
      document.getElementById('spinner').classList.add('spinner-active');
    }, spinnerThresholdMs);
  }
}

export function hideSpinner() {
  if (spinnerTimeout != null) clearTimeout(spinnerTimeout);
  document.getElementById('spinner').classList.remove('spinner-active');
  spinnerTimeout = null;
}
