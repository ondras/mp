import * as player from "player.js";
import * as platform from "platform.js";
import * as command from "util/command.js";

const document = window.document;
const node = document.querySelector("#playlist");
const list = node.querySelector("ol");

let current = null;
let items = [];
let repeat = "";
let height = 0;
let dragging = null;

function highlight() {
	items.forEach(item => {
		item.node.classList.toggle("current", item == current);
	});
}

function updateCommands() {
	let index = items.indexOf(current);
	command[index > 0 ? "enable" : "disable"]("playlist:prev");
	command[index + 1 < items.length ? "enable" : "disable"]("playlist:next");
}

function nodeToIndex(node) {
	let result = -1;
	items.forEach((item, index) => {
		if (item.node == node) { result = index; }
	});
	return result;
}

function playByIndex(index) {
	current = items[index];
	player.play(current.url);
	highlight();
	updateCommands();
}

command.register("playlist:prev", null, () => playByIndex(items.indexOf(current)-1));
command.register("playlist:next", null, () => playByIndex(items.indexOf(current)+1));
command.disable("playlist:");

command.register("playlist:randomize", null, () => {
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

export function setRepeat(r) {
	repeat = r;
}

export function setVisibility(visible) {
	if (visible) {
		platform.resizeBy(0, height);
		node.style.display = "";
	} else {
		height = node.offsetHeight;
		node.style.display = "none";
		platform.resizeBy(0, -height);
	}
}

export function clear() {
	list.innerHTML = "";
	items = [];
	current = null;
}

export function add(url) {
	let item = {
		url: url,
		node: document.createElement("li"),
		remove: document.createElement("button")
	}
	items.push(item);

	list.appendChild(item.node);
	let text = decodeURI(url.href).match(/[^\/]*$/);
	item.node.appendChild(document.createTextNode(text));
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

player.audio.addEventListener("ended", e => {
	let index = items.indexOf(current);
	switch (repeat) {
		case "1":
			playByIndex(index);
		break;

		case "N":
			if (index+1 < items.length) {
				playByIndex(index+1);
			} else {
				playByIndex(0);
			}
		break;

		case "": break;
	}
});
