(function(window) {
	//set audio context
	audioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || AudioContext;
	context = new audioContext();

  // Global volume
  var globalVolumeNode = context.createGain();
  globalVolumeNode.connect(context.destination);

  var nodes = {};

	var baseHarmonics = [0.82, 0.87, 0.9, 0.78];
  var fuzzyFactor = 0.85	;

	var createHarmonics = function (intensities, baseFrequency, acontext) {
		var harmonicsGain = acontext.createGain();
		harmonicsGain.gain.value = 1/intensities.length/2;

		var harmonicsFilter = acontext.createBiquadFilter();
		harmonicsFilter.frequency.value = 2000;
		harmonicsFilter.Q.value = 0.5;

		harmonicsGain.connect(harmonicsFilter);

		// First harmonics
		intensities.map(function (intensity, index) {
			var osc = acontext.createOscillator();
	    var gain = acontext.createGain();
	    osc.frequency.value = baseFrequency * (index + 2) / (index + 1);
			osc.start();
			gain.gain.value = intensity * (1.5 - ((index + 2) / (index + 1)));
			osc.connect(gain);
			gain.connect(harmonicsGain);
		});

		// Second harmonics
		intensities.map(function (intensity, index) {
			var osc = acontext.createOscillator();
	    var gain = acontext.createGain();
	    osc.frequency.value = baseFrequency * 2 * (index + 2) / (index + 1);
			osc.start();
			gain.gain.value = intensity * (1.5 - ((index + 2) / (index + 1)));
			osc.connect(gain);
			gain.connect(harmonicsGain);
		});

		return harmonicsFilter;
	}

	var generateRandomHarmonics = function () {
		return baseHarmonics.map(function(intensity) {
			var fuzzyValue = fuzzyFactor * intensity + ((1 - fuzzyFactor) *(Math.random() - 0.5));
			return Math.max(0, Math.min(1, fuzzyValue));
		});
	}

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

		var harmonics = createHarmonics(generateRandomHarmonics(), frequency, acontext);

    osc.connect(harmonics);
		harmonics.connect(compressor);

    compressor.connect(gain);
    gain.connect(dest);

    osc.start();
    gain.gain.linearRampToValueAtTime(gainValue, acontext.currentTime + 0.1);

    return {
      gain: gain,
			compressor: compressor,
      harmonics: harmonics,
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
		oscillator.harmonics.disconnect();
		oscillator.compressor.disconnect();
		oscillator.gain.disconnect();
		oscillator = {};
		node.oscillators.splice(0, 1);
	}

  var sendSound = function (event) {
		var frequency = event.keyCode * 9 - 200;

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

  document.addEventListener(
    'DOMContentLoaded',
    function() {
      var input = document.getElementById('demo-input');
      input.addEventListener("keydown", sendSound);
      input.addEventListener("keyup", stopSound);
    },
    false);
})(this);
