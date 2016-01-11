const document = window.document;

export default class Vis {
	constructor(audioContext) {
		this._enabled = false;
		this._analyser = audioContext.createAnalyser();
		this._node = document.createElement("canvas");
	}
	
	getAudioNode() { return this._analyser; }

	getNode() { return this._node; }
	
	start() {
		if (!this._enabled) {
			this._enabled = true;
			requestAnimationFrame(() => this._tick());
		}
		return this;
	}
	
	stop() {
		if (this._enabled) { this._enabled = false; }
		return this;
	}
	
	_tick() {
		if (!this._enabled) { return; }
		requestAnimationFrame(() => this._tick());
		this._draw();
	}
	
	_draw() {
	}
}
