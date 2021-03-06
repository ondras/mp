const ctx = new window.AudioContext();
const document = window.document;

export default class Waveform {
	constructor(arrayBuffer, options) {
		this._options = Object.assign({
			width: 600,
			height: 70,
			columns: 600,
			color: "gray"
		}, options);

		this._node = document.createElement("canvas");
		this._node.width = this._options.width;
		this._node.height = this._options.height;

		ctx.decodeAudioData(arrayBuffer, this._decoded.bind(this));
	}

	getNode() { return this._node; }

	_decoded(audioBuffer) {
		let channels = [];
		for (let i=0;i<audioBuffer.numberOfChannels;i++) {
			channels.push(audioBuffer.getChannelData(i));
		}

		let w = new Worker("worker.js");

		w.addEventListener("message", e => {
			if (e.data.type == "waveform") { this._draw(e.data.data); }
		});

		w.postMessage({
			type: "audio-buffer",
			columns: this._options.columns,
			channels
		});
	}

	_draw(data) {
		let width = this._options.width / this._options.columns;

		let ctx = this._node.getContext("2d");
		ctx.beginPath();
		ctx.moveTo(0, this._node.height);

		for (let i=0;i<this._options.columns;i++) {
			let height = data[i] * this._node.height;
			ctx.lineTo(i*width, this._node.height-height);
		}

		ctx.lineTo(this._node.width, this._node.height);
		ctx.closePath();

		let gradient = ctx.createLinearGradient(0, 0, 0, this._node.height);
		gradient.addColorStop(0, "#8cf");
		gradient.addColorStop(1, "#38d");

		ctx.shadowColor = "#000";
		ctx.shadowBlur = 1;
		ctx.shadowOffsetY = -1;
		ctx.fillStyle = gradient;

		ctx.fill();
	}
}
