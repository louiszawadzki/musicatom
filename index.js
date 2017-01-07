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

	var getOldestAliveOscillator = function(oscillators) {
		for (oscillator of oscillators) {
			if (oscillator.state === 'alive') {
				return oscillator;
			}
		};
	}

	var removeOscillator = function(node, oscillator) {
		oscillator.osc.disconnect();
		oscillator.compressor.disconnect();
		oscillator.gain.disconnect();
		oscillator = {};
		node.oscillators.splice(0, 1);
	}

  var sendSound = function (event) {
		var frequency = event.keyCode * 11 - 600;

		if (nodes[event.keyCode] === undefined) {
			nodes[event.keyCode] = {
				status: 'up',
				oscillators: []
			};
		}
    if (event.keyCode !== 17 && event.keyCode !== 18 && nodes[event.keyCode].status === 'up') {
      nodes[event.keyCode].oscillators.push(createOscillator(frequency, context, globalVolumeNode, 0.5));
    }
		nodes[event.keyCode].status = 'down';
  }

  var stopSound = function (event) {
		if (nodes[event.keyCode] === undefined) {
			return;
		}
		var oscillator = getOldestAliveOscillator(nodes[event.keyCode].oscillators);
		if (oscillator != undefined) {
			nodes[event.keyCode].status = 'up';
			oscillator.state = 'dead';
			oscillator.gain.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.5);
			oscillator.osc.stop(context.currentTime + 0.5);
			setTimeout(function () {
				removeOscillator(nodes[event.keyCode], oscillator);
			}, 500);
		}
  }

	atom.workspace.observeTextEditors(function (editor) {
		editorView = atom.views.getView(editor);
		editorView.addEventListener("keydown", sendSound);
		editorView.addEventListener("keyup", stopSound);
	})
})(this);
