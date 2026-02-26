const Spinner = require('spin.js').Spinner;

const $ = jQuery;

const spinner = new Spinner({ lines: 9, radius: 7, length: 7 });
let spinnerTimeout = null;
const spinnerThresholdMs = 100;

function showSpinner() {
  if (spinnerTimeout == null) {
    const target = $('#spinner').get(0);
    spinnerTimeout = setTimeout(() => spinner.spin(target), spinnerThresholdMs);
  }
}

function hideSpinner() {
  if (spinnerTimeout != null) clearTimeout(spinnerTimeout);
  spinner.stop();
  spinnerTimeout = null;
}

module.exports = { showSpinner, hideSpinner };
