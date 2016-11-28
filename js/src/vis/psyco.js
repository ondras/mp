import Vis from "./vis.js";

export default class Psyco extends Vis {
	constructor(audioContext) {
		super(audioContext);

		this._analyser.minDecibels = -130;
		this._analyser.maxDecibels = -20;
		this._analyser.fftSize = 512;
		this._analyser.smoothingTimeConstant = 0.6;

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

		let values = [[], [], []];
		this._data.forEach((value, index) => {
			let i7 = Math.floor(7 * index / this._data.length); /* reduce to 0..6 */
			let i = 0;
			if (i7 > 0) { i = 1; } /* 1..2 go t 1 */
			if (i7 > 2) { i = 2; } /* 3..6 go to 2 */
			values[i].push(value);
		});

		values = values.map(x => Math.max(...x) / 255);
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
