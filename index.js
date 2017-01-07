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
      osc: osc,
			state: 'alive'
    };
  }

	var removeOscillator = function(keyCode) {
		if (nodes[keyCode].state === 'alive') {
			nodes[keyCode].state = 'dying';
			nodes[keyCode].osc.disconnect();
			nodes[keyCode].compressor.disconnect();
			nodes[keyCode].gain.disconnect();
			nodes[keyCode] = {
				state: 'dead'
			};
		}
	}

  var sendSound = function (event) {
    var frequency = (event.keyCode - 65) * 300 / 26 + 100;
    if (event.keyCode !== 17 && event.keyCode !== 18) {
      nodes[event.keyCode] = createOscillator(frequency, context, globalVolumeNode, 0.5);
    } else {
			nodes[event.keyCode] = {
				state: 'non-existing'
			}
		}
  }

  var stopSound = function (event) {
    if (nodes[event.keyCode].state === 'alive') {
      nodes[event.keyCode].gain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.5);
      nodes[event.keyCode].osc.stop(context.currentTime + 0.5);
      setTimeout(function () {
				removeOscillator(event.keyCode);
      }, 500);
    }
  }

	atom.workspace.observeTextEditors(function (editor) {
		editorView = atom.views.getView(editor);
		editorView.addEventListener("keydown", sendSound);
		editorView.addEventListener("keyup", stopSound);
	})
})(this);
