import Vis from "./vis.js";

export default class Spectrum extends Vis {
	constructor(audioContext, options) {
		super(audioContext);

		this._options = Object.assign({
			bins: 32
		}, options);

		this._analyser.fftSize = 2*this._options.bins;
		this._analyser.minDecibels = -130;

		this._data = new Uint8Array(this._analyser.frequencyBinCount);

		this._ctx = this._node.getContext("2d");
	}


	_resize() {
		this._node.width = this._node.clientWidth;
		this._node.height = this._node.clientHeight;

		let gradient = this._ctx.createLinearGradient(0, 0, 0, this._node.height);
		gradient.addColorStop(0, "red");
		gradient.addColorStop(0.5, "yellow");
		gradient.addColorStop(1, "green");
		this._ctx.fillStyle = gradient;
	}

	_draw() {
		if (this._node.width != this._node.clientWidth || this._node.height != this._node.clientHeight) { this._resize(); }

		this._analyser.getByteFrequencyData(this._data);

		this._ctx.clearRect(0, 0, this._node.width, this._node.height);
		for (let i=0;i<this._data.length;i++) {
			this._drawColumn(this._data[i], i);
		}
	}

	_drawColumn(value, index) {
		let boxSize = Math.ceil(this._node.width / this._options.bins)
		let count = Math.round((this._node.height / boxSize) * (value / 255));
		let padding = 2;

		for (let i=0; i<count; i++) {
			this._ctx.fillRect(padding + index*boxSize, this._node.height - i*boxSize, boxSize-padding, boxSize-padding);
		}
	}
}
