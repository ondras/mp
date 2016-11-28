import * as pubsub from "util/pubsub.js";
import * as command from "util/command.js";

const storage = Object.create(null);
storage["repeat"] = "N";
storage["visual"] = "spectrum";
storage["playlist"] = true;

const repeatModes = ["N", "1", ""];
const visualModes = ["spectrum", "psyco", ""];
const storageKey = "mp:settings";

function save() {
	localStorage.setItem(storageKey, JSON.stringify(storage));
}

function load() {
	try {
		let data = JSON.parse(localStorage.getItem(storageKey));
		Object.assign(storage, data);
	} catch (e) {
	}
}

export function get(key) {
	return storage[key];
}

export function set(key, value) {
	storage[key] = value;
	save();
	pubsub.publish("settings-change", this, key);
}

command.register("settings:toggle-repeat", null, () => {
	let key = "repeat";
	let index = repeatModes.indexOf(get(key));
	index = (index+1) % repeatModes.length;
	set(key, repeatModes[index]);
});

command.register("settings:toggle-visual", null, () => {
	let key = "visual";
	let index = visualModes.indexOf(get(key));
	index = (index+1) % visualModes.length;
	set(key, visualModes[index]);
});

command.register("settings:toggle-playlist", null, () => {
	let key = "playlist";
	set(key, !get(key));
});

load();
