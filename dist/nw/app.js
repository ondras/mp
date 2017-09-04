(function () {
'use strict';

const shortcutAliases = {
	"MediaPreviousTrack": "MediaPrevTrack"
};

const argv = nw.App.argv;
const baseURI = `file://${require("process").cwd()}/`;

function showDevTools() {
	nw.Window.get().showDevTools();
}



function onOpen(callback) {
	// FIXME cmdline is incorrectly handling spaces, also it is totally bogus :/
	nw.App.on("open", cmdLine => { 
		let parts = cmdLine.split(/\s+/);
		let args = parts.slice(2);
		args = [args.join(" ")];
		callback(args, baseURI);
	});
}

function globalShortcut(shortcut, cb) {
	if (shortcut in shortcutAliases) { shortcut = shortcutAliases[shortcut]; }

	let cfg = {
		key: shortcut,
		active: cb
	};

	let s = new nw.Shortcut(cfg);
	nw.App.registerGlobalHotKey(s);
}

function resizeBy(dw, dh) {
	nw.Window.get().resizeBy(dw, dh);
}

const codes = {
	back: 8,
	tab: 9,
	enter: 13,
	esc: 27,
	space: 32,
	pgup: 33,
	pgdn: 34,
	end: 35,
	home: 36,
	left: 37,
	up: 38,
	right: 39,
	down: 40,
	ins: 45,
	del: 46,
	f1: 112,
	f2: 113,
	f3: 114,
	f4: 115,
	f5: 116,
	f6: 117,
	f7: 118,
	f8: 119,
	f9: 120,
	f10: 121,
	f11: 122,
	f12: 123
};

const modifiers = ["ctrl", "alt", "shift", "meta"]; // meta = command

let registry$1 = [];

function handler(e) {
	let available = registry$1.filter(reg => {
		if (reg.type != e.type) { return false; }

		for (let m in reg.modifiers) {
			if (reg.modifiers[m] != e[m]) { return false; }
		}

		let code = (e.type == "keypress" ? e.charCode : e.keyCode);
		if (reg.code != code) { return false; }

		return true;
	});


	let index = available.length;
	if (!index) { return; }

	while (index --> 0) {
		let executed = available[index].func();
		if (executed) { return; }
	}
}

function parse(key) {
	let result = {
		func: null,
		modifiers: {}
	};

	key = key.toLowerCase();

	modifiers.forEach(mod => {
		let key = mod + "Key";
		result.modifiers[key] = false;

		let re = new RegExp(mod + "[+-]");
		key = key.replace(re, () => {
			result.modifiers[key] = true;
			return "";
		});
	});

	if (key.length == 1) {
		result.code = key.charCodeAt(0);
		result.type = "keypress";
	} else {
		if (!(key in codes)) { throw new Error("Unknown keyboard code " + key); }
		result.code = codes[key];
		result.type = "keydown";
	}

	return result;
}

function register$1(func, key) {
	let item = parse(key);
	item.func = func;
	registry$1.push(item);
}

window.addEventListener("keydown", handler);
window.addEventListener("keypress", handler);

const storage = Object.create(null);

function publish(message, publisher, data) {
	let subscribers = storage[message] || [];
	subscribers.forEach(subscriber => {
		typeof(subscriber) == "function"
			? subscriber(message, publisher, data)
			: subscriber.handleMessage(message, publisher, data);
	});
}

function subscribe(message, subscriber) {
	if (!(message in storage)) { storage[message] = []; }
	storage[message].push(subscriber);
}

const document$1 = window.document;
const registry = Object.create(null);

function syncDisabledAttribute(command) {
	let enabled = registry[command].enabled;
	let nodes = Array.from(document$1.querySelectorAll(`[data-command='${command}']`));

	nodes.forEach(n => n.disabled = !enabled);
}

function register$$1(command, keys, func) {
	function wrap() {
		if (isEnabled(command)) {
			func(command);
			return true;
		} else {
			return false;
		}
	}

	registry[command] = {
		func: wrap,
		enabled: true
	};

	[].concat(keys || []).forEach(key => register$1(wrap, key));

	return command;
}

function enable(command) {
	Object.keys(registry)
		.filter(c => c.match(command))
		.forEach(c => {
			registry[c].enabled = true;
			syncDisabledAttribute(c);
		});

	publish("command-enable", command);
}

function disable(command) {
	Object.keys(registry)
		.filter(c => c.match(command))
		.forEach(c => {
			registry[c].enabled = false;
			syncDisabledAttribute(c);
		});
	publish("command-disable", command);
}

function isEnabled(command) {
	return registry[command].enabled;
}

function execute(command) {
	return registry[command].func();
}

document$1.body.addEventListener("click", e => {
	let node = e.target;
	while (node) {
		let c = node.getAttribute("data-command");
		if (c) { return execute(c); }
		if (node == event.currentTarget) { break; }
		node = node.parentNode;
	}
});


var command = Object.freeze({
	register: register$$1,
	enable: enable,
	disable: disable,
	isEnabled: isEnabled,
	execute: execute
});

const document$2 = window.document;

class Vis {
	constructor(audioContext) {
		this._enabled = false;
		this._analyser = audioContext.createAnalyser();
		this._node = document$2.createElement("canvas");
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
	
	_draw() {}
}

class Spectrum extends Vis {
	constructor(audioContext, options) {
		super(audioContext);

		this._options = Object.assign({
			bins: 32
		}, options);

		this._analyser.fftSize = 2*this._options.bins;
		this._analyser.minDecibels = -130;
		this._analyser.maxDecibels = -20;
		this._analyser.smoothingTimeConstant = 0.6;

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
		let boxSize = Math.ceil(this._node.width / this._options.bins);
		let count = Math.round((this._node.height / boxSize) * (value / 255));
		let padding = 2;

		for (let i=0; i<count; i++) {
			this._ctx.fillRect(padding + index*boxSize, this._node.height - i*boxSize, boxSize-padding, boxSize-padding);
		}
	}
}

class Psyco extends Vis {
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

const storage$1 = Object.create(null);
storage$1["repeat"] = "N";
storage$1["visual"] = "spectrum";
storage$1["playlist"] = true;

const repeatModes = ["N", "1", ""];
const visualModes = ["spectrum", "psyco", ""];
const storageKey = "mp:settings";

function save() {
	localStorage.setItem(storageKey, JSON.stringify(storage$1));
}

function load() {
	try {
		let data = JSON.parse(localStorage.getItem(storageKey));
		Object.assign(storage$1, data);
	} catch (e) {
	}
}

function get(key) {
	return storage$1[key];
}

function set(key, value) {
	storage$1[key] = value;
	save();
	publish("settings-change", this, key);
}

register$$1("settings:toggle-repeat", null, () => {
	let key = "repeat";
	let index = repeatModes.indexOf(get(key));
	index = (index+1) % repeatModes.length;
	set(key, repeatModes[index]);
});

register$$1("settings:toggle-visual", null, () => {
	let key = "visual";
	let index = visualModes.indexOf(get(key));
	index = (index+1) % visualModes.length;
	set(key, visualModes[index]);
});

register$$1("settings:toggle-playlist", null, () => {
	let key = "playlist";
	set(key, !get(key));
});

load();

const audio = new window.Audio();
const ctx = new window.AudioContext();
const source = ctx.createMediaElementSource(audio);
source.connect(ctx.destination);

const visuals = {
	spectrum: new Spectrum(ctx),
	psyco: new Psyco(ctx)
};
let currentVisual = null;

register$$1("player:play", null, () => audio.play());
register$$1("player:pause", null, () => audio.pause());
register$$1("player:toggle", "space", () => {
	audio.paused ? audio.play() : audio.pause();
});
disable("player:");

function play(url) {
	disable("player:");
	audio.src = url.href;
	audio.play();
}

function syncVisual() {
	let name = get("visual");

	let parent = document.querySelector(".analyser"); // FIXME
	parent.innerHTML = "";

	if (currentVisual) {
		currentVisual.stop();
		let oldAudioNode = currentVisual.getAudioNode();
		source.disconnect(oldAudioNode);
		oldAudioNode.disconnect(ctx.destination);
	} else {
		source.disconnect(ctx.destination);
	}
	
	currentVisual = visuals[name] || null;
	
	if (currentVisual) {
		let audioNode = currentVisual.getAudioNode();
		audioNode.connect(ctx.destination);
		source.connect(audioNode);
		parent.appendChild(currentVisual.getNode());
		currentVisual.start();
	} else {
		source.connect(ctx.destination);
	}
}

function handleEvent(e) {
	console.log(`[e] ${e.type}`);

	switch (e.type) {
		case "loadedmetadata":
			enable("player:toggle");
		break;

		case "playing":
			disable("player:play");
			enable("player:pause");
			currentVisual && currentVisual.start();
		break;

		case "pause":
			disable("player:pause");
			enable("player:play");
			currentVisual && currentVisual.stop();
		break;
	}
}

let handler$1 = {handleEvent};
audio.addEventListener("ended", handler$1);
audio.addEventListener("error", handler$1);
audio.addEventListener("loadedmetadata", handler$1);
audio.addEventListener("playing", handler$1);
audio.addEventListener("pause", handler$1);

function onSettingsChange(message, publisher, data) {
	if (data != "visual") { return; }
	syncVisual();
}

subscribe("settings-change", onSettingsChange);

syncVisual();

const document$3 = window.document;
const node = document$3.querySelector("#playlist");
const list = node.querySelector("ol");

let current = null;
let items = [];
let height = 0;
let dragging = null;

function highlight() {
	items.forEach(item => {
		item.node.classList.toggle("current", item == current);
	});
}

function updateCommands() {
	command[items.length > 1 ? "enable" : "disable"]("playlist:prev");
	command[items.length > 1 ? "enable" : "disable"]("playlist:next");
	command[items.length > 1 ? "enable" : "disable"]("playlist:randomize");
}

function nodeToIndex(node) {
	let result = -1;
	items.forEach((item, index) => {
		if (item.node == node) { result = index; }
	});
	return result;
}

function playByIndex(index) {
	index = (index + items.length) % items.length; // forcing positive modulus
	current = items[index];
	play(current.url);
	highlight();
	updateCommands();
}

register$$1("playlist:prev", null, () => playByIndex(items.indexOf(current)-1));
register$$1("playlist:next", null, () => playByIndex(items.indexOf(current)+1));

register$$1("playlist:randomize", null, () => {
	let newItems = [];
	let index = items.indexOf(current);

	while (items.length) {
		newItems.push(items.splice(index, 1)[0]);
		index = Math.floor(items.length*Math.random());
	}

	items = newItems;

	list.innerHTML = "";
	items.forEach(item => list.appendChild(item.node));

	updateCommands();
});

function syncVisibility() {
	let visible = get("playlist");
	let isVisible = (node.style.display != "none");
	if (visible == isVisible) { return; }

	if (visible) {
		resizeBy(0, height);
		node.style.display = "";
	} else {
		height = node.offsetHeight;
		node.style.display = "none";
		resizeBy(0, -height);
	}
}

function clear() {
	list.innerHTML = "";
	items = [];
	current = null;
	updateCommands();
}

function add(url) {
	let item = {
		url: url,
		node: document$3.createElement("li"),
		remove: document$3.createElement("button")
	};
	items.push(item);

	list.appendChild(item.node);
	let text = decodeURI(url.href).match(/[^\/]*$/);
	item.node.appendChild(document$3.createTextNode(text));
	item.remove.title = "Remove from playlist";
	item.node.appendChild(item.remove);
	item.node.draggable = true;

	if (items.length == 1) { 
		current = items[0];
		highlight();
	}
	updateCommands();
}

list.addEventListener("click", e => {
	let remove = false, node = e.target;
	if (node.nodeName.toLowerCase() == "button") {
		remove = true;
		node = node.parentNode;
	}
	
	let index = nodeToIndex(node);
	if (index == -1) { return; }

	e.preventDefault();
	if (remove) {
		let item = items.splice(index, 1)[0];
		item.node.parentNode.removeChild(item.node);
		updateCommands();
	} else {
		playByIndex(index);
	}
});

list.addEventListener("dragstart", e => {
	dragging = nodeToIndex(e.target);
});

list.addEventListener("dragenter", e => {
	let targetIndex = nodeToIndex(e.target);
	if (targetIndex == -1 || targetIndex == dragging) { return; }

	let item = items.splice(dragging, 1)[0];
	items.splice(targetIndex, 0, item);

	list.innerHTML = "";
	items.forEach(item => list.appendChild(item.node));

	dragging = targetIndex;
});

audio.addEventListener("ended", e => {
	let index = items.indexOf(current);
	let repeat = get("repeat");

	switch (repeat) {
		case "1": // repeat current
			playByIndex(index);
		break;

		case "N": // repeat playlist, i.e. advance to next/first
			if (index+1 < items.length) {
				playByIndex(index+1);
			} else {
				playByIndex(0);
			}
		break;

		case "": break; // no repeat at all
	}
});

function syncSettings(message, publisher, data) {
	if (data != "playlist") { return; }
	syncVisibility();
}

subscribe("settings-change", syncSettings);
syncVisibility();
clear();

function xhr(url) {
	let r = new window.XMLHttpRequest();
	r.responseType = "arraybuffer";
	r.open("get", url, true);
	r.send();

	return new Promise((resolve, reject) => {
		r.addEventListener("load", e => resolve(e.target));
		r.addEventListener("error", reject);
	});	
}

const document$5 = window.document;
const node$1 = document$5.querySelector("#albumart");
const files = ["Cover.jpg", "cover.jpg", "Folder.jpg", "folder.jpg"];

function doShow(src) {
	node$1.style.backgroundImage = `url(${src})`;
}

function tryFile(url) {
	return xhr(url).then(r => {
		// for real http. file:// will reject the xhr instead
		if (r.status == 404) { throw new Error(); }
		return url;
	});
}

function clear$1() {
	node$1.style.backgroundImage = "";
}

function show(metadataCover, audioSrc) {
	if (metadataCover) {
		let mC = metadataCover;
		let src = URL.createObjectURL(new Blob([mC.data], {type:mC.type}));
		doShow(src);
		return;
	}
	
	let f = files.slice();
	let tryNext = () => {
		if (!f.length) { return; }
		try {
			let url = new window.URL(f.shift(), audioSrc);
			tryFile(url.href).then(doShow, tryNext);
		} catch (e) {
			tryNext();
		}
	};	
	tryNext();
}

const ctx$1 = new window.AudioContext();
const document$6 = window.document;

class Waveform {
	constructor(arrayBuffer, options) {
		this._options = Object.assign({
			width: 600,
			height: 70,
			columns: 600,
			color: "gray"
		}, options);

		this._node = document$6.createElement("canvas");
		this._node.width = this._options.width;
		this._node.height = this._options.height;

		ctx$1.decodeAudioData(arrayBuffer, this._decoded.bind(this));
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

function accepts(arrayBuffer) {
	let data = new DataView(arrayBuffer);
	return (data.getString(arrayBuffer.byteLength-128, 3) == "TAG");
}

function decode(arrayBuffer) {
	let data = new DataView(arrayBuffer, arrayBuffer.byteLength-125);

	let encoding = "windows-1252";
	let offset = 0;
	let result = {};
	["title", "artist", "album"].forEach(name => {
		let str = data.getString(offset, 30, encoding);
		offset += 30;
		if (str) { result[name] = str; }
	});

	return result;
}


var id3v1 = Object.freeze({
	accepts: accepts,
	decode: decode
});

function accepts$1(arrayBuffer) {
	let data = new DataView(arrayBuffer);
	return (data.getString(0, 3) == "ID3");
}

function decode$1(arrayBuffer) {
	let headerLength = 10;
	let header = new DataView(arrayBuffer, 0, headerLength + 4); // space for extended header length
	let version = header.getUint8(3);
	let length = header.getUint32ss(6);

	let mask = header.getUint8(5);
	if (mask & 0x40) {
		let extendedLength = header.getUint32(headerLength);
		headerLength += extendedLength;
		length -= extendedLength;		
	}

	let data = new DataView(arrayBuffer, headerLength, length);
	return parse$1(data, version);
}

function getEncoding(byte) {
	switch (byte) {		
		case 0: return "iso-8859-1"; break;
		
		case 1:
		case 2: return "utf-16"; break;
		
		case 3:
		default: return "utf-8"; break;
	}
 }

function getStringArray(data) {
	let encoding = getEncoding(data.getUint8(0));
	return data.getString(1, data.byteLength-1, encoding)
			.replace(/\x00+$/, "")
			.split(/\x00/);
}

function getPicture(data) {
	let offset = 0;
	
	let encoding = getEncoding(data.getUint8(offset++));
	
	let mime = "";
	while (1) {
		let byte = data.getUint8(offset++);
		if (byte) {
			mime += String.fromCharCode(byte);
		} else {
			break;
		}
	}
	
	let type = data.getUint8(offset++);
	if (type != 3) { return null; } // 3 == front cover

	while (1) { // description
		let byte = data.getUint8(offset++);
		if (!byte) { break; }
	}
	
	if (encoding == "utf-16") { offset += 1; }

	let start = data.byteOffset + offset;
	let end = data.byteOffset + data.byteLength;
	return {
		type: mime,
		data: data.buffer.slice(start, end)
	}
}

function removeUnsync(data) {
	let readIndex = 0, writeIndex = 0;
	while (readIndex < data.byteLength-1) {
		if (readIndex != writeIndex) {
			data.setUint8(writeIndex, data.getUint8(readIndex));
		}
		readIndex++;
		writeIndex++;
		if (data.getUint8(readIndex-1) == 0xFF && data.getUint8(readIndex) == 0) { readIndex++; }
	}
	if (readIndex < data.byteLength) {
		data.setUint8(writeIndex++, data.getUint8(readIndex++));
	}
	return data.slice(0, writeIndex);
}

function parse$1(data, version) {
	let result = {};

	let offset = 0;
	while (offset < data.byteLength) {
		let id = data.getString(offset, 4);
		if (!id.charAt(0).match(/[A-Z]/)) { break; }

		let flags = data.getUint8(offset+9);
		let size = (version == 4 ? data.getUint32ss(offset+4) : data.getUint32(offset+4));
		
		offset += 10;
		let value = data.slice(offset, offset + size);

		
		if (flags & 3) { // unsynchronization
			value = removeUnsync(value);
		}
		
		if (flags & 1) { // "data length indicator"
			value = value.slice(4);
		}

		switch (id) {
			case "APIC": // picture
				let pic = getPicture(value);
				if (pic) { result.cover = pic; window.pic = pic;}
			break;
			case "TALB": // album
				result.album = getStringArray(value);
			break;
			case "TIT2": // title
				result.title = getStringArray(value);
			break;
			case "TPE1": // artist
				result.artist = getStringArray(value);
			break;
			case "TPE2": // album artist
				result.albumartist = getStringArray(value);
			break;

		}

		offset += size;
	}
	return result;
}


var id3v2 = Object.freeze({
	accepts: accepts$1,
	decode: decode$1
});

function accepts$2(arrayBuffer) {
	let data = new DataView(arrayBuffer);
	return (data.getString(0, 4) == "OggS");
}

function decode$2(arrayBuffer) {
	let data = new DataView(arrayBuffer);

	let page = readPage(data, 0);
	if (!page) { return null; }

	let comments = readPage(data, page.size, true);
	if (!comments) { return null; }

	return readComments(comments.data);
}

function readPage(data, offset, getData) {
	let page = {
		size: 0,
		data: null
	};

	let pageSegments = data.getUint8(offset + 26);
	if (!pageSegments) { return null; }
	let headerSize = 27 + pageSegments;

	page.size = headerSize;
	for (let i=0; i<pageSegments; i++) { page.size += data.getUint8(offset + 27 + i); }

	if (getData) {
		let length = headerSize + 1 + "vorbis".length;
		page.data = new DataView(data.buffer, data.byteOffset + offset + length, page.size - length);
	}

	return page;
}

function readComments(comments) {
	let result = {};

	let vendorLength = comments.getUint32(0, true);
	let commentListLength = comments.getUint32(4 + vendorLength, true);
	let offset = 8 + vendorLength;

	for (let i=0; i<commentListLength; i++) {
		let len = comments.getUint32(offset, true);
		let str = comments.getString(offset+4, len);

		let index = str.indexOf('=');
		let key = str.substring(0, index).toLowerCase();
		result[key] = str.substring(index+1);
		offset += 4 + len;
		
		if (offset >= comments.byteLength) { break; }
	}

	return result;
}


var ogg = Object.freeze({
	accepts: accepts$2,
	decode: decode$2
});

const containers = ["moov", "udta", "meta", "ilst", "trak", "mdia"];

function accepts$3(arrayBuffer) {
	let data = new DataView(arrayBuffer);
	let str = data.getString(4, 8);
	return (str == "ftypM4A " || str == "ftypmp42");
}

function decode$3(arrayBuffer) {
	let data = new DataView(arrayBuffer);
	let offset = 0;

	while (offset < arrayBuffer.byteLength) {
		let size = data.getUint32(offset);
		let name = data.getString(offset+4, 4, "ascii");

		if (name == "ilst") {
			let view = new DataView(arrayBuffer, offset+8, size-8);
			return processIlstAtom(view);
		}

		if (containers.indexOf(name) > -1) {
			offset += 8;
			if (name == "meta") { offset += 4; }
		} else {
			offset += size;
		}
	}
}

function processIlstAtom(data) {
	let result = {};

	let offset = 0;
	while (offset < data.byteLength) {
		let size = data.getUint32(offset);
		let name = data.getString(offset+4, 4, "ascii");

		switch (name.toLowerCase()) {
			case "©alb":
				result.album = processDataAtom(data, offset+8); 
			break;

			case "©art":
				result.artist = processDataAtom(data, offset+8); 
			break;

			case "©nam":
				result.title = processDataAtom(data, offset+8);
			break;

			case "aart":
				result.albumartist = processDataAtom(data, offset+8);
			break;

			case "covr":
				result.cover = processDataAtom(data, offset+8);
			break;
		}
		offset += size;
	}

	return result;
}

function processDataAtom(data, offset) {
	let size = data.getUint32(offset);
	let name = data.getString(offset+4, 4, "ascii");

	let type = data.getUint32(offset + 8);

	offset += 16;
	size -= 16;

	switch (type) {
		case 1: // text
			return data.getString(offset, size);
		break;
		
		case 13: // jpeg
		case 14: // png
			let types = {13:"jpeg", 14:"png"};
			return {
				type: `image/${types[type]}`,
				data: data.buffer.slice(data.byteOffset + offset, data.byteOffset + offset + size) 
			}
		break;
	}
}


var mp4 = Object.freeze({
	accepts: accepts$3,
	decode: decode$3
});

DataView.prototype.getString = function(offset, length, encoding) {
	let decoder = new TextDecoder(encoding);
	let view = this.buffer.slice(this.byteOffset + offset, this.byteOffset + offset + length);
	return decoder.decode(view);
};

DataView.prototype.slice = function(start, end) {
	if (arguments.length < 2) { end = this.byteLength; }
	
	return new DataView(this.buffer, this.byteOffset + start, end - start);
};

DataView.prototype.getUint32ss = function(offset) {
	return this.getInt8(offset + 3) & 0x7f
		 | ((this.getInt8(offset + 2)) << 7)
		 | ((this.getInt8(offset + 1)) << 14)
		 | (this.getInt8(offset) << 21);
};


const decoders = [id3v2, id3v1, ogg, mp4];

function metadata(arrayBuffer) {
	for (let decoder of decoders) {
		if (decoder.accepts(arrayBuffer)) {
			return decoder.decode(arrayBuffer);
		}
	}
	return null;
}

const document$4 = window.document;

let dom = {
	node: document$4.querySelector("#info")
};
["waveform", "current", "time-played", "time-remaining", "metadata"].forEach(name => {
	dom[name] = dom.node.querySelector(`.${name}`);
});

function leadingZero(num) {
	return (num > 9 ? "" : "0") + num;
}

function formatTime(sec) {
	let s = leadingZero(sec % 60);
	sec = Math.floor(sec / 60);
	let m = leadingZero(sec % 60);
	sec = Math.floor(sec / 60);
	let h = sec;
	
	let parts = [m, s];
	if (h) { parts.unshift(h); }
	return parts.join(":");
}

function showTime(current, duration) {
	let frac = duration ? current / duration : 0;
	dom.current.style.left = `${100*frac}%`;
	
	dom["time-played"].innerHTML = formatTime(Math.round(current));
	dom["time-remaining"].innerHTML = `&minus;${formatTime(Math.round(duration)-Math.round(current))}`;
}

function readFile(url) {
	return xhr(url).then(r => r.response);
}

function showText(title, subtitle) {
	let h1 = dom.metadata.querySelector("h1");
	let h2 = dom.metadata.querySelector("h2");

	h1.innerHTML = "";
	h1.appendChild(document$4.createTextNode(title));
	h1.title = title;

	h2.innerHTML = "";
	h2.appendChild(document$4.createTextNode(subtitle));
	h2.title = subtitle;
}

function showMetadata(metadata$$1) {
	let title = metadata$$1 && metadata$$1.title || decodeURI(audio.src).match(/[^\/]*$/);

	let subtitle = [];
	let artist = metadata$$1 && (metadata$$1.artist || metadata$$1.albumartist);
	if (artist) { subtitle.push(artist); }
	if (metadata$$1 && metadata$$1.album) { subtitle.push(metadata$$1.album); }
	subtitle = subtitle.join(" · ");

	showText(title, subtitle);
	
	show(metadata$$1 && metadata$$1.cover, audio.src);
}

audio.addEventListener("timeupdate", function(e) {
	showTime(e.target.currentTime, e.target.duration);
});

audio.addEventListener("error", function(e) {
	clear$1();
	showText("[audio error]", e.message || "");
});

audio.addEventListener("loadedmetadata", function(e) {
	clear$1();

	showTime(0, 0);
	dom.waveform.innerHTML = "";

	readFile(e.target.src).then(data => {
		let m = metadata(data);
		showMetadata(m);

		let options = {
			width: dom.waveform.offsetWidth,
			height: dom.waveform.offsetHeight
		};
		let w = new Waveform(data, options);
		dom.waveform.appendChild(w.getNode());
	});
});

dom.node.addEventListener("click", e => {
	let rect = dom.node.getBoundingClientRect();
	let left = e.clientX - rect.left;
	let frac = left / rect.width;
	audio.currentTime = frac * audio.duration;
});

const document$7 = window.document;
const dom$1 = document$7.querySelector("#controls");

const repeatTitles = {
	"N": "Repeat playlist",
	"1": "Repeat song",
	"": "No repeat"
};

const visualTitles = {
	"spectrum": "Spectrum analyser", 
	"psyco": "Visual Player 2.0 for DOS",
	"": "No visuals"
};

const visualSubs = {
	"spectrum": "1", 
	"psyco": "2",
	"": ""
};

function sync(message, publisher, data) {
	let node;

	let repeat = get("repeat");
	node = dom$1.querySelector("[data-command='settings:toggle-repeat']");
	node.classList.toggle("on", repeat != "");
	node.querySelector("sub").innerHTML = repeat;
	node.title = repeatTitles[repeat];

	let playlist = get("playlist");
	node = dom$1.querySelector("[data-command='settings:toggle-playlist']");
	node.classList.toggle("on", playlist);
	node.title = (playlist ? "Playlist visible" : "Playlist hidden");

	let visual = get("visual");
	node = dom$1.querySelector("[data-command='settings:toggle-visual']");
	node.classList.toggle("on", visual != "");
	node.querySelector("sub").innerHTML = visualSubs[visual];
	node.title = visualTitles[visual];
}

subscribe("settings-change", sync);

globalShortcut("MediaPreviousTrack", () => execute("playlist:prev"));
globalShortcut("MediaNextTrack", () => execute("playlist:next"));
globalShortcut("MediaPlayPause", () => execute("player:toggle"));

sync();

/* just to initialize those */
register$$1("app:devtools", "f12", () => {
	showDevTools();
});

register$$1("app:close", "esc", () => {
	window.close();
});

function isPlaylist(url) {
	return url.href.match(/\.m3u8?$/i);
}

function getPlaylist(url) {
	let encoding = url.href.match(/8$/) ? "utf-8" : "windows-1250";
	let decoder = new TextDecoder(encoding);

	return xhr(url.href).then(r => {
		let view = new DataView(r.response);
		let str = decoder.decode(view);
		let urls = str.split("\n")
			.map(row => row.replace(/#.*/, ""))
			.filter(row => row.match(/\S/))
			.map(s => new window.URL(s, url));
		return urls;
	});
}

function playFile(url) {
	if (isPlaylist(url)) {
		return getPlaylist(url).then(urls => Promise.all(urls.map(playFile)));
	} else {
		add(url);
		if (!isEnabled("playlist:next")) { // play the first one enqueued
			play(url);
		}
		return Promise.resolve();
	}
}

function enqueueFile(url) {
	if (isPlaylist(url)) {
		return getPlaylist(url).then(urls => Promise.all(urls.map(enqueueFile)));
	} else {
		add(url);
		return Promise.resolve();
	}
}

function toURL(stuff, base) {
	return (stuff instanceof window.URL ? stuff : new window.URL(stuff, base));
}

function processCommand(c) {
	switch (c) {
		case "play": execute("player:play"); break;
		case "pause": execute("player:pause"); break;
		case "prev": execute("playlist:prev"); break; 
		case "next": execute("playlist:next"); break; 
		default: alert(`Unknown command '${c}'.`); break;
	}
}

function processArgs(args, baseURI$$1) {
	let playlistCleared = false;
	let command = "p";
	
	args.forEach(arg => {
		if (arg.charAt(0) == "-") {
			command = arg.slice(1);
			return;
		}
		
		let url;
		switch (command) {
			case "p":
				url = toURL(arg, baseURI$$1);
				if (!playlistCleared) {
					clear();
					playlistCleared = true;
					playFile(url);
				} else {
					enqueueFile(url);
				}
			break;
			
			case "q":
				url = toURL(arg, baseURI$$1);
				enqueueFile(url);
			break;
			
			case "c":
				processCommand(arg);
			break;
			
			default:
				alert(`Unknown argument '${arg}' for command '${command}'.`);
			break;
		}
	});
}

onOpen(processArgs);

if (argv.length) {
	processArgs(argv, baseURI);
} else {
	alert("No arguments received, starting in dummy mode. Re-launch with more arguments, drop some files, or control a running instance to play something.");
}

window.addEventListener("dragover", e => {
	if (e.dataTransfer.files.length) { e.preventDefault(); }
});

window.addEventListener("drop", e => {
	e.preventDefault();
	Array.from(e.dataTransfer.files).forEach(file => {
		let url = window.URL.createObjectURL(file);
		enqueueFile(new window.URL(url));
	});
});

}());
