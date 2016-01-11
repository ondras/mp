import * as player from "player.js";
import * as platform from "platform.js";

const document = window.document;
const node = document.querySelector("#playlist");
const list = node.querySelector("ol");

let current = null;
let items = [];
let repeat = "";
let height = 0;
let dragging = null;

function activate() {
	items.forEach(item => {
		item.node.classList.toggle("current", item == current);
	});
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
	activate();
}

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

export function isEnabled(command) {
	let index = items.indexOf(current);
	switch (command) {
		case "prev":
			return (index > 0);
		break;

		case "next":
			return (index+1 < items.length);
		break;

		/* FIXME default? */
	}
}

export function clear() {
	list.innerHTML = "";
	items = [];
	current = null;
}

export function add(url) {
	var item = {
		url: url,
		node: document.createElement("li"),
		remove: document.createElement("button")
	}
	items.push(item);

	list.appendChild(item.node);
	var text = decodeURI(url.href).match(/[^\/]*$/);
	item.node.appendChild(document.createTextNode(text));
	item.remove.title = "Remove from playlist";
	item.node.appendChild(item.remove);
	item.node.draggable = true;

	if (items.length == 1) { 
		current = items[0];
		activate();
	}
}

export function prev() {
	if (!isEnabled("prev")) { return; }
	playByIndex(items.indexOf(current)-1);
}

export function next() {
	if (!isEnabled("next")) { return; }
	playByIndex(items.indexOf(current)+1);
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
				next();
			} else {
				playByIndex(0);
			}
		break;

		case "":
			if (index+1 < items.length) { next(); }
		break;
	}
});

node.querySelector("button.random").addEventListener("click", e => {
	e.preventDefault();

	let newItems = [];
	let index = items.indexOf(current);

	while (items.length) {
		newItems.push(items.splice(index, 1)[0]);
		index = Math.floor(items.length*Math.random());
	}

	items = newItems;

	list.innerHTML = "";
	items.forEach(item => list.appendChild(item.node));
});
