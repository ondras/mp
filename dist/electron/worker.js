onmessage = function(e) {
	switch (e.data.type) {
		case "audio-buffer":
			let data = computeWaveform(e.data.channels, e.data.columns);
			postMessage({type:"waveform", data});
		break;
	}
}

function computeColumn(channels, fromSample, toSample) {
	let sum = 0;

	for (let i=fromSample; i<toSample; i++) {
		for (let j=0; j<channels.length; j++) {
			sum += Math.abs(channels[j][i]);
		}
	}

	let count = (toSample - fromSample) * channels.length;
	return 2*sum/count;
}

function computeWaveform(channels, columns) {
	let data = [];
	let samplesPerColumn = Math.floor(channels[0].length / columns);
	for (let i=0;i<columns;i++) {
		let val = computeColumn(channels, i*samplesPerColumn, (i+1)*samplesPerColumn);
		data.push(val);
	}
	return data;
}
