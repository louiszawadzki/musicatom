(function(window) {
	//set audio context
	audioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || AudioContext;
	context = new audioContext();

  // Global volume
  var globalVolumeNode = context.createGain();
  globalVolumeNode.connect(context.destination);

  var nodes = {};


  var createOscillator = function (frequency, acontext, dest, gainValue) {
    var osc = acontext.createOscillator();
    var gain = acontext.createGain();
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, acontext.currentTime);

    var compressor = acontext.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.reduction.value = -20;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    osc.connect(compressor);
    compressor.connect(gain);
    gain.connect(dest);

    osc.start();
    gain.gain.linearRampToValueAtTime(gainValue, acontext.currentTime + 0.1);

    return {
      gain: gain,
      compressor: compressor,
      osc: osc
    };
  }

  var sendSound = function (event) {
    var frequency = (event.keyCode - 65) * 300 / 26 + 100;
    if (event.keyCode !== 17 && event.keyCode !== 18) {
      nodes[event.keyCode] = createOscillator(frequency, context, globalVolumeNode, 0.5);
    }
  }

  var stopSound = function (event) {
    if (nodes[event.keyCode] !== undefined) {
      nodes[event.keyCode].gain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.5);
      nodes[event.keyCode].osc.stop(context.currentTime + 0.5);
      setTimeout(function () {
        nodes[event.keyCode].osc.disconnect();
        nodes[event.keyCode].compressor.disconnect();
        nodes[event.keyCode].gain.disconnect();
        nodes[event.keyCode] = {};
      }, 500);
    }
  }

  window.addEventListener("keydown", sendSound);
  window.addEventListener("keyup", stopSound);
})(this);
