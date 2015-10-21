$ = jQuery

spinner = new Spinner lines: 9, radius: 7, length: 7
spinnerTimeout = null
spinnerThresholdMs = 100
showSpinner = ->
  unless spinnerTimeout?
    target = ($ '#spinner').get 0
    spinnerTimeout =
      setTimeout (-> spinner.spin target), spinnerThresholdMs
hideSpinner = ->
  clearTimeout spinnerTimeout if spinnerTimeout?
  spinner.stop()
  spinnerTimeout = null

module.exports = {showSpinner, hideSpinner}
