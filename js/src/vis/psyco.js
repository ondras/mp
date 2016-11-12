import Vis from "./vis.js";

export default class Psyco extends Vis {
	constructor(audioContext) {
		super(audioContext);

		this._analyser.minDecibels = -130;
		this._analyser.fftSize = 64;

		this._data = new Uint8Array(this._analyser.frequencyBinCount);

		this._ctx = this._node.getContext("2d");
	}


	_resize() {
		this._node.width = this._node.clientWidth;
		this._node.height = this._node.clientHeight;
	}

	_draw() {
		if (this._node.width != this._node.clientWidth || this._node.height != this._node.clientHeight) { this._resize(); }
		this._analyser.getByteFrequencyData(this._data);

		let values = [0, 0, 0];
		let samplesPerValue = Math.floor(this._data.length / values.length);

		for (let i=0;i<this._data.length;i++) {
			let index = Math.floor(i/samplesPerValue);
			if (index >= values.length) { continue; }
			values[index] += this._data[i];
		}

		values = values.map(value => Math.min(1, value / (255*samplesPerValue)));
		window.values = values;
		let radius = Math.min(this._node.width, this._node.height) / 5;

		this._ctx.clearRect(0, 0, this._node.width, this._node.height);
		this._drawCircle(values[0], {color:[255,  60, 60], radius, x:  (1/5+1/10), y:1/3});
		this._drawCircle(values[1], {color:[255, 255, 60], radius, x:1-(1/5+1/10), y:1/3});
		this._drawCircle(values[2], {color:[60,  255, 60], radius, x:         1/2, y:2/3});
	}

	_drawCircle(value, options) {
		let cx = options.x * this._node.width;
		let cy = options.y * this._node.height;

		let size = value * options.radius;

		let grad = this._ctx.createRadialGradient(cx, cy, 5, cx, cy, size);
		let alpha = (value > 0.8 ? value-0.7 : 0);
		let c1 = `rgba(${options.color.join(",")}, 1)`;
		let c2 = `rgba(${options.color.join(",")}, ${alpha})`;
		grad.addColorStop(0, c1);
		grad.addColorStop(1, c2);

		this._ctx.beginPath();
		this._ctx.arc(cx, cy, size, 0, 2*Math.PI, 0);
		this._ctx.fillStyle = grad;
		this._ctx.fill();
	}
}
