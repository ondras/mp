!function(a){"use strict";function b(a,b){if("/"===a.charAt(0)&&(a=a.slice(1)),"."!==a.charAt(0))return a;for(var c=a.split("/");"."===c[0]||".."===c[0];)".."===c.shift()&&b.pop();return b.concat(c).join("/")}function c(a){var b=m[a];return b&&!l[a]&&(l[a]=!0,b.execute()),b&&b.proxy}function d(a,b){n[a]=b}function e(a){return n[a]||c(a)}function f(a){return!!n[a]||!!m[a]}function g(a,b){var c=document.createElement("script");c.async&&(c.async=!1),k?c.onreadystatechange=function(){/loaded|complete/.test(this.readyState)&&(this.onreadystatechange=null,b())}:c.onload=c.onerror=b,c.setAttribute("src",a),j.appendChild(c)}function h(a){return new Promise(function(b,c){g((o.baseURL||"/")+a+".js",function(){i&&(o.register(a,i[0],i[1]),i=void 0);var d=m[a];return d?void Promise.all(d.deps.map(function(a){return n[a]||m[a]?Promise.resolve():h(a)})).then(b,c):void c(new Error("Error loading module "+a))})})}var i,j=document.getElementsByTagName("head")[0],k=/MSIE/.test(navigator.userAgent),l=Object.create(null),m=Object.create(null),n=Object.create(null),o={set:d,get:e,has:f,"import":function(a){return new Promise(function(c){var d=b(a,[]),f=e(d);return f?c(f):h(a).then(function(){return e(d)})})},register:function(a,c,d){if(Array.isArray(a))return i=[],void i.push.apply(i,arguments);var f,g,h=Object.create(null),j=Object.create(null);m[a]=f={proxy:h,values:j,deps:c.map(function(c){return b(c,a.split("/").slice(0,-1))}),dependants:[],update:function(a,b){g.setters[f.deps.indexOf(a)](b)},execute:function(){f.deps.map(function(b){var c=n[b];c?f.update(b,c):(c=e(b)&&m[b].values,c&&(m[b].dependants.push(a),f.update(b,c)))}),g.execute()}},g=d(function(b,c){return j[b]=c,f.lock=!0,f.dependants.forEach(function(b){m[b]&&!m[b].lock&&m[b].update(a,j)}),f.lock=!1,Object.getOwnPropertyDescriptor(h,b)||Object.defineProperty(h,b,{enumerable:!0,get:function(){return j[b]}}),c})}};a.System=o}(window);"use strict";

System.register("waveform.js", [], function (_export, _context) {
	var _createClass, ctx, document, Waveform;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			ctx = new window.AudioContext();
			document = window.document;

			Waveform = function () {
				function Waveform(arrayBuffer, options) {
					_classCallCheck(this, Waveform);

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

				_createClass(Waveform, [{
					key: "getNode",
					value: function getNode() {
						return this._node;
					}
				}, {
					key: "_decoded",
					value: function _decoded(audioBuffer) {
						var channels = [];

						for (var i = 0; i < audioBuffer.numberOfChannels; i++) {
							channels.push(audioBuffer.getChannelData(i));
						}

						var ctx = this._node.getContext("2d");

						ctx.beginPath();
						ctx.moveTo(0, this._node.height);
						var width = this._options.width / this._options.columns;
						var samplesPerColumn = Math.floor(channels[0].length / this._options.columns);

						for (var i = 0; i < this._options.columns; i++) {
							var val = this._computeColumn(channels, i * samplesPerColumn, (i + 1) * samplesPerColumn);

							var height = val * this._node.height;
							ctx.lineTo(i * width, this._node.height - height);
						}

						ctx.lineTo(this._node.width, this._node.height);
						ctx.closePath();
						var gradient = ctx.createLinearGradient(0, 0, 0, this._node.height);
						gradient.addColorStop(0, "#8cf");
						gradient.addColorStop(1, "#38d");
						ctx.shadowColor = "#000";
						ctx.shadowBlur = 1;
						ctx.shadowOffsetY = -1;
						ctx.fillStyle = gradient;
						ctx.fill();
					}
				}, {
					key: "_computeColumn",
					value: function _computeColumn(channels, fromSample, toSample) {
						var sum = 0;

						for (var i = fromSample; i < toSample; i++) {
							for (var j = 0; j < channels.length; j++) {
								sum += Math.abs(channels[j][i]);
							}
						}

						var count = (toSample - fromSample) * channels.length;
						return 2 * sum / count;
					}
				}]);

				return Waveform;
			}();

			_export("default", Waveform);
		}
	};
});

"use strict";

System.register("playlist.js", ["player.js", "platform.js", "util/command.js"], function (_export, _context) {
	var player, platform, command, document, node, list, current, items, repeat, height, dragging;

	function highlight() {
		items.forEach(function (item) {
			item.node.classList.toggle("current", item == current);
		});
	}

	function updateCommands() {
		var index = items.indexOf(current);
		command[index > 0 ? "enable" : "disable"]("playlist:prev");
		command[index + 1 < items.length ? "enable" : "disable"]("playlist:next");
	}

	function nodeToIndex(node) {
		var result = -1;
		items.forEach(function (item, index) {
			if (item.node == node) {
				result = index;
			}
		});
		return result;
	}

	function playByIndex(index) {
		current = items[index];
		player.play(current.url);
		highlight();
		updateCommands();
	}

	return {
		setters: [function (_playerJs) {
			player = _playerJs;
		}, function (_platformJs) {
			platform = _platformJs;
		}, function (_utilCommandJs) {
			command = _utilCommandJs;
		}],
		execute: function () {
			document = window.document;
			node = document.querySelector("#playlist");
			list = node.querySelector("ol");
			current = null;
			items = [];
			repeat = "";
			height = 0;
			dragging = null;
			command.register("playlist:prev", null, function () {
				return playByIndex(items.indexOf(current) - 1);
			});
			command.register("playlist:next", null, function () {
				return playByIndex(items.indexOf(current) + 1);
			});
			command.disable("playlist:");

			function setRepeat(r) {
				repeat = r;
			}

			_export("setRepeat", setRepeat);

			function setVisibility(visible) {
				if (visible) {
					platform.resizeBy(0, height);
					node.style.display = "";
				} else {
					height = node.offsetHeight;
					node.style.display = "none";
					platform.resizeBy(0, -height);
				}
			}

			_export("setVisibility", setVisibility);

			function clear() {
				list.innerHTML = "";
				items = [];
				current = null;
			}

			_export("clear", clear);

			function add(url) {
				var item = {
					url: url,
					node: document.createElement("li"),
					remove: document.createElement("button")
				};
				items.push(item);
				list.appendChild(item.node);
				var text = decodeURI(url.href).match(/[^\/]*$/);
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

			_export("add", add);

			list.addEventListener("click", function (e) {
				var remove = false,
				    node = e.target;

				if (node.nodeName.toLowerCase() == "button") {
					remove = true;
					node = node.parentNode;
				}

				var index = nodeToIndex(node);

				if (index == -1) {
					return;
				}

				e.preventDefault();

				if (remove) {
					var item = items.splice(index, 1)[0];
					item.node.parentNode.removeChild(item.node);
					updateCommands();
				} else {
					playByIndex(index);
				}
			});
			list.addEventListener("dragstart", function (e) {
				dragging = nodeToIndex(e.target);
			});
			list.addEventListener("dragenter", function (e) {
				var targetIndex = nodeToIndex(e.target);

				if (targetIndex == -1 || targetIndex == dragging) {
					return;
				}

				var item = items.splice(dragging, 1)[0];
				items.splice(targetIndex, 0, item);
				list.innerHTML = "";
				items.forEach(function (item) {
					return list.appendChild(item.node);
				});
				dragging = targetIndex;
			});
			player.audio.addEventListener("ended", function (e) {
				var index = items.indexOf(current);

				switch (repeat) {
					case "1":
						playByIndex(index);
						break;

					case "N":
						if (index + 1 < items.length) {
							next();
						} else {
							playByIndex(0);
						}

						break;

					case "":
						if (index + 1 < items.length) {
							next();
						}

						break;
				}
			});
			node.querySelector("button.random").addEventListener("click", function (e) {
				e.preventDefault();
				var newItems = [];
				var index = items.indexOf(current);

				while (items.length) {
					newItems.push(items.splice(index, 1)[0]);
					index = Math.floor(items.length * Math.random());
				}

				items = newItems;
				list.innerHTML = "";
				items.forEach(function (item) {
					return list.appendChild(item.node);
				});
				updateCommands();
			});
		}
	};
});

"use strict";

System.register("util/pubsub.js", [], function (_export, _context) {
	var storage;
	return {
		setters: [],
		execute: function () {
			storage = Object.create(null);

			function publish(message, publisher, data) {
				var subscribers = storage[message] || [];
				subscribers.forEach(function (subscriber) {
					typeof subscriber == "function" ? subscriber(message, publisher, data) : subscriber.handleMessage(message, publisher, data);
				});
			}

			_export("publish", publish);

			function subscribe(message, subscriber) {
				if (!(message in storage)) {
					storage[message] = [];
				}

				storage[message].push(subscriber);
			}

			_export("subscribe", subscribe);

			function unsubscribe(message, subscriber) {
				var index = (storage[message] || []).indexOf(subscriber);

				if (index > -1) {
					storage[message].splice(index, 1);
				}
			}

			_export("unsubscribe", unsubscribe);
		}
	};
});

"use strict";

System.register("util/albumart.js", ["util/xhr.js"], function (_export, _context) {
	var xhr, document, node, files;

	function doShow(src) {
		node.style.backgroundImage = "url(" + src + ")";
	}

	function tryFile(url) {
		return xhr(url).then(function (r) {
			if (r.status == 404) {
				throw new Error();
			}

			return url;
		});
	}

	return {
		setters: [function (_utilXhrJs) {
			xhr = _utilXhrJs.default;
		}],
		execute: function () {
			document = window.document;
			node = document.querySelector("#albumart");
			files = ["Cover.jpg", "cover.jpg", "Folder.jpg", "folder.jpg"];

			function clear() {
				node.style.backgroundImage = "";
			}

			_export("clear", clear);

			function show(metadataCover, audioSrc) {
				if (metadataCover) {
					var mC = metadataCover;
					var src = URL.createObjectURL(new Blob([mC.data], {
						type: mC.type
					}));
					doShow(src);
					return;
				}

				var f = files.slice();

				var tryNext = function tryNext() {
					if (!f.length) {
						return;
					}

					try {
						var url = new window.URL(f.shift(), audioSrc);
						tryFile(url.href).then(doShow, tryNext);
					} catch (e) {
						tryNext();
					}
				};

				tryNext();
			}

			_export("show", show);
		}
	};
});

"use strict";

System.register("util/xhr.js", [], function (_export, _context) {
	function xhr(url) {
		var r = new window.XMLHttpRequest();
		r.responseType = "arraybuffer";
		r.open("get", url, true);
		r.send();
		return new Promise(function (resolve, reject) {
			r.addEventListener("load", function (e) {
				return resolve(e.target);
			});
			r.addEventListener("error", reject);
		});
	}

	_export("default", xhr);

	return {
		setters: [],
		execute: function () {}
	};
});

"use strict";

System.register("util/keyboard.js", [], function (_export, _context) {
	var codes, modifiers, registry;

	function handler(e) {
		var available = registry.filter(function (reg) {
			if (reg.type != e.type) {
				return false;
			}

			for (var m in reg.modifiers) {
				if (reg.modifiers[m] != e[m]) {
					return false;
				}
			}

			var code = e.type == "keypress" ? e.charCode : e.keyCode;

			if (reg.code != code) {
				return false;
			}

			return true;
		});
		var index = available.length;

		if (!index) {
			return;
		}

		while (index-- > 0) {
			var executed = available[index].func();

			if (executed) {
				return;
			}
		}
	}

	function parse(key) {
		var result = {
			func: null,
			modifiers: {}
		};
		key = key.toLowerCase();
		modifiers.forEach(function (mod) {
			var key = mod + "Key";
			result.modifiers[key] = false;
			var re = new RegExp(mod + "[+-]");
			key = key.replace(re, function () {
				result.modifiers[key] = true;
				return "";
			});
		});

		if (key.length == 1) {
			result.code = key.charCodeAt(0);
			result.type = "keypress";
		} else {
			if (!(key in codes)) {
				throw new Error("Unknown keyboard code " + key);
			}

			result.code = codes[key];
			result.type = "keydown";
		}

		return result;
	}

	return {
		setters: [],
		execute: function () {
			codes = {
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
			modifiers = ["ctrl", "alt", "shift", "meta"];
			registry = [];

			function register(func, key) {
				var item = parse(key);
				item.func = func;
				registry.push(item);
			}

			_export("register", register);

			window.addEventListener("keydown", handler);
			window.addEventListener("keypress", handler);
		}
	};
});

"use strict";

System.register("util/command.js", ["./keyboard.js", "./pubsub.js"], function (_export, _context) {
	var keyboard, pubsub, registry;
	return {
		setters: [function (_keyboardJs) {
			keyboard = _keyboardJs;
		}, function (_pubsubJs) {
			pubsub = _pubsubJs;
		}],
		execute: function () {
			registry = {};

			function register(command, keys, func) {
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
				[].concat(keys || []).forEach(function (key) {
					return keyboard.register(wrap, key);
				});
				return command;
			}

			_export("register", register);

			function enable(command) {
				Object.keys(registry).filter(function (c) {
					return c.match(command);
				}).forEach(function (c) {
					return registry[c].enabled = true;
				});
				pubsub.publish("command-enable", command);
			}

			_export("enable", enable);

			function disable(command) {
				Object.keys(registry).filter(function (c) {
					return c.match(command);
				}).forEach(function (c) {
					return registry[c].enabled = false;
				});
				pubsub.publish("command-disable", command);
			}

			_export("disable", disable);

			function isEnabled(command) {
				return registry[command].enabled;
			}

			_export("isEnabled", isEnabled);

			function execute(command) {
				return registry[command].func();
			}

			_export("execute", execute);
		}
	};
});

"use strict";

System.register("info.js", ["player.js", "util/albumart.js", "util/xhr.js", "waveform.js", "metadata/metadata.js"], function (_export, _context) {
	var player, albumart, xhr, Waveform, metadata, document, dom;

	function leadingZero(num) {
		return (num > 9 ? "" : "0") + num;
	}

	function formatTime(sec) {
		var s = leadingZero(sec % 60);
		sec = Math.floor(sec / 60);
		var m = leadingZero(sec % 60);
		sec = Math.floor(sec / 60);
		var h = sec;
		var parts = [m, s];

		if (h) {
			parts.unshift(h);
		}

		return parts.join(":");
	}

	function showTime(current, duration) {
		var frac = duration ? current / duration : 0;
		dom.current.style.left = 100 * frac + "%";
		dom["time-played"].innerHTML = formatTime(Math.round(current));
		dom["time-remaining"].innerHTML = "&minus;" + formatTime(Math.round(duration) - Math.round(current));
	}

	function readFile(url) {
		return xhr(url).then(function (r) {
			return r.response;
		});
	}

	function showText(title, subtitle) {
		var h1 = dom.metadata.querySelector("h1");
		var h2 = dom.metadata.querySelector("h2");
		h1.innerHTML = "";
		h1.appendChild(document.createTextNode(title));
		h1.title = title;
		h2.innerHTML = "";
		h2.appendChild(document.createTextNode(subtitle));
		h2.title = subtitle;
	}

	function showMetadata(metadata) {
		var title = metadata && metadata.title || decodeURI(player.audio.src).match(/[^\/]*$/);
		var subtitle = [];
		var artist = metadata && (metadata.artist || metadata.albumartist);

		if (artist) {
			subtitle.push(artist);
		}

		if (metadata && metadata.album) {
			subtitle.push(metadata.album);
		}

		subtitle = subtitle.join(" · ");
		showText(title, subtitle);
		albumart.show(metadata && metadata.cover, player.audio.src);
	}

	return {
		setters: [function (_playerJs) {
			player = _playerJs;
		}, function (_utilAlbumartJs) {
			albumart = _utilAlbumartJs;
		}, function (_utilXhrJs) {
			xhr = _utilXhrJs.default;
		}, function (_waveformJs) {
			Waveform = _waveformJs.default;
		}, function (_metadataMetadataJs) {
			metadata = _metadataMetadataJs.default;
		}],
		execute: function () {
			document = window.document;
			dom = {
				node: document.querySelector("#info")
			};
			["waveform", "current", "time-played", "time-remaining", "metadata"].forEach(function (name) {
				dom[name] = dom.node.querySelector("." + name);
			});
			player.audio.addEventListener("timeupdate", function (e) {
				showTime(e.target.currentTime, e.target.duration);
			});
			player.audio.addEventListener("error", function (e) {
				albumart.clear();
				showText("[audio error]", e.message || "");
			});
			player.audio.addEventListener("loadedmetadata", function (e) {
				albumart.clear();
				showTime(0, 0);
				dom.waveform.innerHTML = "";
				readFile(e.target.src).then(function (data) {
					var m = metadata(data);
					showMetadata(m);
					var options = {
						width: dom.waveform.offsetWidth,
						height: dom.waveform.offsetHeight
					};
					var w = new Waveform(data, options);
					dom.waveform.appendChild(w.getNode());
				});
			});
			dom.node.addEventListener("click", function (e) {
				var rect = dom.node.getBoundingClientRect();
				var left = e.clientX - rect.left;
				var frac = left / rect.width;
				player.audio.currentTime = frac * player.audio.duration;
			});
		}
	};
});

"use strict";

System.register("metadata/id3v2.js", [], function (_export, _context) {
	function getEncoding(byte) {
		switch (byte) {
			case 0:
				return "iso-8859-1";
				break;

			case 1:
			case 2:
				return "utf-16";
				break;

			case 3:
			default:
				return "utf-8";
				break;
		}
	}

	function getStringArray(data) {
		var encoding = getEncoding(data.getUint8(0));
		return data.getString(1, data.byteLength - 1, encoding).replace(/\x00+$/, "").split(/\x00/);
	}

	function getPicture(data) {
		var offset = 0;
		var encoding = getEncoding(data.getUint8(offset++));
		var mime = "";

		while (1) {
			var byte = data.getUint8(offset++);

			if (byte) {
				mime += String.fromCharCode(byte);
			} else {
				break;
			}
		}

		var type = data.getUint8(offset++);

		if (type != 3) {
			return null;
		}

		while (1) {
			var byte = data.getUint8(offset++);

			if (!byte) {
				break;
			}
		}

		if (encoding == "utf-16") {
			offset += 1;
		}

		var start = data.byteOffset + offset;
		var end = data.byteOffset + data.byteLength;
		return {
			type: mime,
			data: data.buffer.slice(start, end)
		};
	}

	function removeUnsync(data) {
		var readIndex = 0,
		    writeIndex = 0;

		while (readIndex < data.byteLength - 1) {
			if (readIndex != writeIndex) {
				data.setUint8(writeIndex, data.getUint8(readIndex));
			}

			readIndex++;
			writeIndex++;

			if (data.getUint8(readIndex - 1) == 0xFF && data.getUint8(readIndex) == 0) {
				readIndex++;
			}
		}

		if (readIndex < data.byteLength) {
			data.setUint8(writeIndex++, data.getUint8(readIndex++));
		}

		return data.slice(0, writeIndex);
	}

	function parse(data, version) {
		var result = {};
		var offset = 0;

		while (offset < data.byteLength) {
			var id = data.getString(offset, 4);

			if (!id.charAt(0).match(/[A-Z]/)) {
				break;
			}

			var flags = data.getUint8(offset + 9);
			var size = version == 4 ? data.getUint32ss(offset + 4) : data.getUint32(offset + 4);
			offset += 10;
			var value = data.slice(offset, offset + size);

			if (flags & 3) {
				value = removeUnsync(value);
			}

			if (flags & 1) {
				value = value.slice(4);
			}

			switch (id) {
				case "APIC":
					var pic = getPicture(value);

					if (pic) {
						result.cover = pic;
						window.pic = pic;
					}

					break;

				case "TALB":
					result.album = getStringArray(value);
					break;

				case "TIT2":
					result.title = getStringArray(value);
					break;

				case "TPE1":
					result.artist = getStringArray(value);
					break;

				case "TPE2":
					result.albumartist = getStringArray(value);
					break;
			}

			offset += size;
		}

		return result;
	}

	return {
		setters: [],
		execute: function () {
			function accepts(arrayBuffer) {
				var data = new DataView(arrayBuffer);
				return data.getString(0, 3) == "ID3";
			}

			_export("accepts", accepts);

			function decode(arrayBuffer) {
				var headerLength = 10;
				var header = new DataView(arrayBuffer, 0, headerLength + 4);
				var version = header.getUint8(3);
				var length = header.getUint32ss(6);
				var mask = header.getUint8(5);

				if (mask & 0x40) {
					var extendedLength = header.getUint32(headerLength);
					headerLength += extendedLength;
					length -= extendedLength;
				}

				var data = new DataView(arrayBuffer, headerLength, length);
				return parse(data, version);
			}

			_export("decode", decode);
		}
	};
});

"use strict";

System.register("metadata/metadata.js", ["./id3v1.js", "./id3v2.js", "./ogg.js", "./mp4.js"], function (_export, _context) {
	var id3v1, id3v2, ogg, mp4, decoders;

	function metadata(arrayBuffer) {
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = decoders[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var decoder = _step.value;

				if (decoder.accepts(arrayBuffer)) {
					return decoder.decode(arrayBuffer);
				}
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}

		return null;
	}

	_export("default", metadata);

	return {
		setters: [function (_id3v1Js) {
			id3v1 = _id3v1Js;
		}, function (_id3v2Js) {
			id3v2 = _id3v2Js;
		}, function (_oggJs) {
			ogg = _oggJs;
		}, function (_mp4Js) {
			mp4 = _mp4Js;
		}],
		execute: function () {
			DataView.prototype.getString = function (offset, length, encoding) {
				var decoder = new TextDecoder(encoding);
				var view = this.buffer.slice(this.byteOffset + offset, this.byteOffset + offset + length);
				return decoder.decode(view);
			};

			DataView.prototype.slice = function (start, end) {
				if (arguments.length < 2) {
					end = this.byteLength;
				}

				return new DataView(this.buffer, this.byteOffset + start, end - start);
			};

			DataView.prototype.getUint32ss = function (offset) {
				return this.getInt8(offset + 3) & 0x7f | this.getInt8(offset + 2) << 7 | this.getInt8(offset + 1) << 14 | this.getInt8(offset) << 21;
			};

			decoders = [id3v2, id3v1, ogg, mp4];
		}
	};
});

"use strict";

System.register("metadata/mp4.js", [], function (_export, _context) {
	var containers;

	function processIlstAtom(data) {
		var result = {};
		var offset = 0;

		while (offset < data.byteLength) {
			var size = data.getUint32(offset);
			var name = data.getString(offset + 4, 4, "ascii");

			switch (name.toLowerCase()) {
				case "©alb":
					result.album = processDataAtom(data, offset + 8);
					break;

				case "©art":
					result.artist = processDataAtom(data, offset + 8);
					break;

				case "©nam":
					result.title = processDataAtom(data, offset + 8);
					break;

				case "aart":
					result.albumartist = processDataAtom(data, offset + 8);
					break;

				case "covr":
					result.cover = processDataAtom(data, offset + 8);
					break;
			}

			offset += size;
		}

		return result;
	}

	function processDataAtom(data, offset) {
		var size = data.getUint32(offset);
		var name = data.getString(offset + 4, 4, "ascii");
		var type = data.getUint32(offset + 8);
		offset += 16;
		size -= 16;

		switch (type) {
			case 1:
				return data.getString(offset, size);
				break;

			case 13:
			case 14:
				var types = {
					13: "jpeg",
					14: "png"
				};
				return {
					type: "image/" + types[type],
					data: data.buffer.slice(data.byteOffset + offset, data.byteOffset + offset + size)
				};
				break;
		}
	}

	return {
		setters: [],
		execute: function () {
			containers = ["moov", "udta", "meta", "ilst", "trak", "mdia"];

			function accepts(arrayBuffer) {
				var data = new DataView(arrayBuffer);
				var str = data.getString(4, 8);
				return str == "ftypM4A " || str == "ftypmp42";
			}

			_export("accepts", accepts);

			function decode(arrayBuffer) {
				var data = new DataView(arrayBuffer);
				var offset = 0;

				while (offset < arrayBuffer.byteLength) {
					var size = data.getUint32(offset);
					var name = data.getString(offset + 4, 4, "ascii");

					if (name == "ilst") {
						var view = new DataView(arrayBuffer, offset + 8, size - 8);
						return processIlstAtom(view);
					}

					if (containers.indexOf(name) > -1) {
						offset += 8;

						if (name == "meta") {
							offset += 4;
						}
					} else {
						offset += size;
					}
				}
			}

			_export("decode", decode);
		}
	};
});

"use strict";

System.register("metadata/id3v1.js", [], function (_export, _context) {
	return {
		setters: [],
		execute: function () {
			function accepts(arrayBuffer) {
				var data = new DataView(arrayBuffer);
				return data.getString(arrayBuffer.byteLength - 128, 3) == "TAG";
			}

			_export("accepts", accepts);

			function decode(arrayBuffer) {
				var data = new DataView(arrayBuffer, arrayBuffer.byteLength - 125);
				var encoding = "windows-1252";
				var offset = 0;
				var result = {};
				["title", "artist", "album"].forEach(function (name) {
					var str = data.getString(offset, 30, encoding);
					offset += 30;

					if (str) {
						result[name] = str;
					}
				});
				return result;
			}

			_export("decode", decode);
		}
	};
});

"use strict";

System.register("metadata/ogg.js", [], function (_export, _context) {
	function readPage(data, offset, getData) {
		var page = {
			size: 0,
			data: null
		};
		var pageSegments = data.getUint8(offset + 26);

		if (!pageSegments) {
			return null;
		}

		var headerSize = 27 + pageSegments;
		page.size = headerSize;

		for (var i = 0; i < pageSegments; i++) {
			page.size += data.getUint8(offset + 27 + i);
		}

		if (getData) {
			var length = headerSize + 1 + "vorbis".length;
			page.data = new DataView(data.buffer, data.byteOffset + offset + length, page.size - length);
		}

		return page;
	}

	function readComments(comments) {
		var result = {};
		var vendorLength = comments.getUint32(0, true);
		var commentListLength = comments.getUint32(4 + vendorLength, true);
		var offset = 8 + vendorLength;

		for (var i = 0; i < commentListLength; i++) {
			var len = comments.getUint32(offset, true);
			var str = comments.getString(offset + 4, len);
			var index = str.indexOf('=');
			var key = str.substring(0, index).toLowerCase();
			result[key] = str.substring(index + 1);
			offset += 4 + len;

			if (offset >= comments.byteLength) {
				break;
			}
		}

		return result;
	}

	return {
		setters: [],
		execute: function () {
			function accepts(arrayBuffer) {
				var data = new DataView(arrayBuffer);
				return data.getString(0, 4) == "OggS";
			}

			_export("accepts", accepts);

			function decode(arrayBuffer) {
				var data = new DataView(arrayBuffer);
				var page = readPage(data, 0);

				if (!page) {
					return null;
				}

				var comments = readPage(data, page.size, true);

				if (!comments) {
					return null;
				}

				return readComments(comments.data);
			}

			_export("decode", decode);
		}
	};
});

"use strict";

System.register("player.js", ["vis/spectrum.js", "vis/psyco.js", "util/command.js"], function (_export, _context) {
	var Spectrum, Psyco, command, audio, ctx, source, visuals, visual;
	return {
		setters: [function (_visSpectrumJs) {
			Spectrum = _visSpectrumJs.default;
		}, function (_visPsycoJs) {
			Psyco = _visPsycoJs.default;
		}, function (_utilCommandJs) {
			command = _utilCommandJs;
		}],
		execute: function () {
			_export("audio", audio = new window.Audio());

			_export("audio", audio);

			ctx = new window.AudioContext();
			source = ctx.createMediaElementSource(audio);
			source.connect(ctx.destination);
			visuals = {
				spectrum: new Spectrum(ctx),
				psyco: new Psyco(ctx)
			};
			command.register("player:play", null, function () {
				return audio.play();
			});
			command.register("player:pause", null, function () {
				return audio.pause();
			});
			command.register("player:toggle", "space", function () {
				audio.paused ? audio.play() : audio.pause();
			});

			function play(url) {
				command.disable("player:");
				audio.src = url.href;
				audio.play();
			}

			_export("play", play);

			visual = null;

			function setVisual(name) {
				var parent = document.querySelector(".analyser");
				parent.innerHTML = "";

				if (visual) {
					visual.stop();
					var oldAudioNode = visual.getAudioNode();
					source.disconnect(oldAudioNode);
					oldAudioNode.disconnect(ctx.destination);
				} else {
					source.disconnect(ctx.destination);
				}

				visual = visuals[name];

				if (visual) {
					var audioNode = visual.getAudioNode();
					audioNode.connect(ctx.destination);
					source.connect(audioNode);
					parent.appendChild(visual.getNode());
					visual.start();
				} else {
					source.connect(ctx.destination);
				}
			}

			_export("setVisual", setVisual);

			audio.addEventListener("ended", function (e) {
				console.log("[e] ended");
			});
			audio.addEventListener("error", function (e) {
				console.log("[e] error", e);
			});
			audio.addEventListener("loadedmetadata", function (e) {
				console.log("[e] loaded metadata");
				command.enable("player:toggle");
			});
			audio.addEventListener("playing", function (e) {
				console.log("[e] playing");
				command.disable("player:play");
				command.enable("player:pause");
				visual && visual.start();
			});
			audio.addEventListener("pause", function (e) {
				console.log("[e] pause");
				command.disable("player:pause");
				command.enable("player:play");
				visual && visual.stop();
			});
		}
	};
});

"use strict";

System.register("app.js", ["platform.js", "util/command.js", "util/xhr.js", "player.js", "playlist.js", "info.js", "controls.js"], function (_export, _context) {
	var platform, command, xhr, player, playlist, info, controls;

	function isPlaylist(url) {
		return url.href.match(/\.m3u8?$/i);
	}

	function getPlaylist(url) {
		var encoding = url.href.match(/8$/) ? "utf-8" : "windows-1250";
		var decoder = new TextDecoder(encoding);
		return xhr(url.href).then(function (r) {
			var view = new DataView(r.response);
			var str = decoder.decode(view);
			var urls = str.split("\n").map(function (row) {
				return row.replace(/#.*/, "");
			}).filter(function (row) {
				return row.match(/\S/);
			}).map(function (s) {
				return new window.URL(s, url);
			});
			return urls;
		});
	}

	function playFile(url) {
		if (isPlaylist(url)) {
			return getPlaylist(url).then(function (urls) {
				return Promise.all(urls.map(playFile));
			});
		} else {
			return playSong(url);
		}
	}

	function enqueueFile(url) {
		if (isPlaylist(url)) {
			return getPlaylist(url).then(function (urls) {
				return Promise.all(urls.map(enqueueFile));
			});
		} else {
			return enqueueSong(url);
		}
	}

	function playSong(url) {
		var promise = enqueueSong(url);

		if (!command.isEnabled("playlist:next")) {
			player.play(url);
		}

		return promise;
	}

	function enqueueSong(url) {
		playlist.add(url);
		return Promise.resolve();
	}

	function toURL(stuff, base) {
		return stuff instanceof window.URL ? stuff : new window.URL(stuff, base);
	}

	function processCommand(c) {
		switch (c) {
			case "play":
				command.execute("player:play");
				break;

			case "pause":
				command.execute("player:pause");
				break;

			case "prev":
				command.execute("playlist:prev");
				break;

			case "next":
				command.execute("playlist:next");
				break;

			default:
				alert("Unknown command '" + c + "'.");
				break;
		}
	}

	function processArgs(args, baseURI) {
		var playlistCleared = false;
		var command = "p";
		args.forEach(function (arg) {
			if (arg.charAt(0) == "-") {
				command = arg.slice(1);
				return;
			}

			var url = undefined;

			switch (command) {
				case "p":
					url = toURL(arg, baseURI);

					if (!playlistCleared) {
						playlist.clear();
						playlistCleared = true;
						playFile(url);
					} else {
						enqueueFile(url);
					}

					break;

				case "q":
					url = toURL(arg, baseURI);
					enqueueFile(url);
					break;

				case "c":
					processCommand(arg);
					break;

				default:
					alert("Unknown argument '" + arg + "' for command '" + command + "'.");
					break;
			}
		});
	}

	return {
		setters: [function (_platformJs) {
			platform = _platformJs;
		}, function (_utilCommandJs) {
			command = _utilCommandJs;
		}, function (_utilXhrJs) {
			xhr = _utilXhrJs.default;
		}, function (_playerJs) {
			player = _playerJs;
		}, function (_playlistJs) {
			playlist = _playlistJs;
		}, function (_infoJs) {
			info = _infoJs;
		}, function (_controlsJs) {
			controls = _controlsJs;
		}],
		execute: function () {
			command.register("app:devtools", "f12", function () {
				platform.showDevTools();
			});
			command.register("app:close", "esc", function () {
				window.close();
			});
			platform.onOpen(processArgs);

			if (platform.argv.length) {
				processArgs(platform.argv, platform.baseURI);
			} else {
				alert("No arguments received, starting in dummy mode. Re-launch with more arguments, drop some files or control a running instance to play something.");
			}

			window.addEventListener("dragover", function (e) {
				if (e.dataTransfer.files.length) {
					e.preventDefault();
				}
			});
			window.addEventListener("drop", function (e) {
				e.preventDefault();
				Array.from(e.dataTransfer.files).forEach(function (file) {
					var url = window.URL.createObjectURL(file);
					enqueueFile(new URL(url));
				});
			});
		}
	};
});

"use strict";

System.register("controls.js", ["player.js", "playlist.js", "platform.js", "util/command.js", "util/pubsub.js"], function (_export, _context) {
	var player, playlist, platform, command, pubsub, document, repeatModes, repeatTitles, visualModes, visualLabels, visualTitles, settings, dom;

	function setPlaylist(state) {
		settings.playlist = state;
		dom.playlist.classList.toggle("on", state);
		dom.playlist.title = state ? "Playlist visible" : "Playlist hidden";
		playlist.setVisibility(state);
	}

	function setRepeat(index) {
		settings.repeat = index;
		var str = repeatModes[index];
		dom.repeat.classList.toggle("on", str != "");
		dom.repeat.querySelector("sub").innerHTML = str;
		playlist.setRepeat(str);
		dom.repeat.title = repeatTitles[index];
	}

	function setVisual(index) {
		settings.visual = index;
		var str = visualModes[index];
		dom.visual.classList.toggle("on", str != "");
		player.setVisual(str);
		dom.visual.querySelector("sub").innerHTML = visualLabels[index];
		dom.visual.title = visualTitles[index];
	}

	function sync() {
		dom.prev.disabled = !command.isEnabled("playlist:prev");
		dom.next.disabled = !command.isEnabled("playlist:next");
		dom.node.className = command.isEnabled("player:play") ? "paused" : "playing";
	}

	return {
		setters: [function (_playerJs) {
			player = _playerJs;
		}, function (_playlistJs) {
			playlist = _playlistJs;
		}, function (_platformJs) {
			platform = _platformJs;
		}, function (_utilCommandJs) {
			command = _utilCommandJs;
		}, function (_utilPubsubJs) {
			pubsub = _utilPubsubJs;
		}],
		execute: function () {
			document = window.document;
			repeatModes = ["N", "1", ""];
			repeatTitles = ["Repeat playlist", "Repeat song", "No repeat"];
			visualModes = ["spectrum", "psyco", ""];
			visualLabels = ["1", "2", ""];
			visualTitles = ["Spectrum analyser", "Visual Player 2.0 for DOS", "No visuals"];
			settings = {
				repeat: 0,
				playlist: true,
				visual: 0
			};
			dom = {
				node: document.querySelector("#controls")
			};
			["prev", "next", "play", "pause", "repeat", "playlist", "visual"].forEach(function (name) {
				dom[name] = dom.node.querySelector("." + name);
			});
			dom.prev.addEventListener("click", function (e) {
				return command.execute("playlist:prev");
			});
			dom.next.addEventListener("click", function (e) {
				return command.execute("playlist:next");
			});
			dom.pause.addEventListener("click", function (e) {
				return command.execute("player:pause");
			});
			dom.play.addEventListener("click", function (e) {
				return command.execute("player:play");
			});
			dom.repeat.addEventListener("click", function (e) {
				setRepeat((settings.repeat + 1) % repeatModes.length);
			});
			dom.visual.addEventListener("click", function (e) {
				setVisual((settings.visual + 1) % visualModes.length);
			});
			dom.playlist.addEventListener("click", function (e) {
				setPlaylist(!settings.playlist);
			});
			platform.globalShortcut("MediaPreviousTrack", function () {
				return command.execute("playlist:prev");
			});
			platform.globalShortcut("MediaNextTrack", function () {
				return command.execute("playlist:next");
			});
			platform.globalShortcut("MediaPlayPause", function () {
				return command.execute("player:toggle");
			});
			pubsub.subscribe("command-enable", sync);
			pubsub.subscribe("command-disable", sync);
			sync();
			setRepeat(0);
			setPlaylist(true);
			setVisual(0);
		}
	};
});

"use strict";

System.register("vis/vis.js", [], function (_export, _context) {
	var _createClass, document, Vis;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			document = window.document;

			Vis = function () {
				function Vis(audioContext) {
					_classCallCheck(this, Vis);

					this._enabled = false;
					this._analyser = audioContext.createAnalyser();
					this._node = document.createElement("canvas");
				}

				_createClass(Vis, [{
					key: "getAudioNode",
					value: function getAudioNode() {
						return this._analyser;
					}
				}, {
					key: "getNode",
					value: function getNode() {
						return this._node;
					}
				}, {
					key: "start",
					value: function start() {
						var _this = this;

						if (!this._enabled) {
							this._enabled = true;
							requestAnimationFrame(function () {
								return _this._tick();
							});
						}

						return this;
					}
				}, {
					key: "stop",
					value: function stop() {
						if (this._enabled) {
							this._enabled = false;
						}

						return this;
					}
				}, {
					key: "_tick",
					value: function _tick() {
						var _this2 = this;

						if (!this._enabled) {
							return;
						}

						requestAnimationFrame(function () {
							return _this2._tick();
						});

						this._draw();
					}
				}, {
					key: "_draw",
					value: function _draw() {}
				}]);

				return Vis;
			}();

			_export("default", Vis);
		}
	};
});

"use strict";

System.register("vis/psyco.js", ["./vis.js"], function (_export, _context) {
	var Vis, _createClass, Psyco;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _possibleConstructorReturn(self, call) {
		if (!self) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}

	return {
		setters: [function (_visJs) {
			Vis = _visJs.default;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			Psyco = function (_Vis) {
				_inherits(Psyco, _Vis);

				function Psyco(audioContext) {
					_classCallCheck(this, Psyco);

					var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Psyco).call(this, audioContext));

					_this._analyser.minDecibels = -130;
					_this._analyser.fftSize = 64;
					_this._data = new Uint8Array(_this._analyser.frequencyBinCount);
					_this._ctx = _this._node.getContext("2d");
					return _this;
				}

				_createClass(Psyco, [{
					key: "_resize",
					value: function _resize() {
						this._node.width = this._node.clientWidth;
						this._node.height = this._node.clientHeight;
					}
				}, {
					key: "_draw",
					value: function _draw() {
						if (this._node.width != this._node.clientWidth || this._node.height != this._node.clientHeight) {
							this._resize();
						}

						this._analyser.getByteFrequencyData(this._data);

						var values = [0, 0, 0];
						var samplesPerValue = Math.floor(this._data.length / values.length);

						for (var i = 0; i < this._data.length; i++) {
							var index = Math.floor(i / samplesPerValue);

							if (index >= values.length) {
								continue;
							}

							values[index] += this._data[i];
						}

						values = values.map(function (value) {
							return Math.min(1, value / (255 * samplesPerValue));
						});
						window.values = values;
						var radius = Math.min(this._node.width, this._node.height) / 5;

						this._ctx.clearRect(0, 0, this._node.width, this._node.height);

						this._drawCircle(values[0], {
							color: [255, 60, 60],
							radius: radius,
							x: 1 / 5 + 1 / 10,
							y: 1 / 3
						});

						this._drawCircle(values[1], {
							color: [255, 255, 60],
							radius: radius,
							x: 1 - (1 / 5 + 1 / 10),
							y: 1 / 3
						});

						this._drawCircle(values[2], {
							color: [60, 255, 60],
							radius: radius,
							x: 1 / 2,
							y: 2 / 3
						});
					}
				}, {
					key: "_drawCircle",
					value: function _drawCircle(value, options) {
						var cx = options.x * this._node.width;
						var cy = options.y * this._node.height;
						var size = value * options.radius;

						var grad = this._ctx.createRadialGradient(cx, cy, 5, cx, cy, size);

						var alpha = value > 0.8 ? value - 0.7 : 0;
						var c1 = "rgba(" + options.color.join(",") + ", 1)";
						var c2 = "rgba(" + options.color.join(",") + ", " + alpha + ")";
						grad.addColorStop(0, c1);
						grad.addColorStop(1, c2);

						this._ctx.beginPath();

						this._ctx.arc(cx, cy, size, 0, 2 * Math.PI, 0);

						this._ctx.fillStyle = grad;

						this._ctx.fill();
					}
				}]);

				return Psyco;
			}(Vis);

			_export("default", Psyco);
		}
	};
});

"use strict";

System.register("vis/spectrum.js", ["./vis.js"], function (_export, _context) {
	var Vis, _createClass, Spectrum;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _possibleConstructorReturn(self, call) {
		if (!self) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}

	return {
		setters: [function (_visJs) {
			Vis = _visJs.default;
		}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			Spectrum = function (_Vis) {
				_inherits(Spectrum, _Vis);

				function Spectrum(audioContext, options) {
					_classCallCheck(this, Spectrum);

					var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Spectrum).call(this, audioContext));

					_this._options = Object.assign({
						bins: 32
					}, options);
					_this._analyser.fftSize = 2 * _this._options.bins;
					_this._analyser.minDecibels = -130;
					_this._data = new Uint8Array(_this._analyser.frequencyBinCount);
					_this._ctx = _this._node.getContext("2d");
					return _this;
				}

				_createClass(Spectrum, [{
					key: "_resize",
					value: function _resize() {
						this._node.width = this._node.clientWidth;
						this._node.height = this._node.clientHeight;

						var gradient = this._ctx.createLinearGradient(0, 0, 0, this._node.height);

						gradient.addColorStop(0, "red");
						gradient.addColorStop(0.5, "yellow");
						gradient.addColorStop(1, "green");
						this._ctx.fillStyle = gradient;
					}
				}, {
					key: "_draw",
					value: function _draw() {
						if (this._node.width != this._node.clientWidth || this._node.height != this._node.clientHeight) {
							this._resize();
						}

						this._analyser.getByteFrequencyData(this._data);

						this._ctx.clearRect(0, 0, this._node.width, this._node.height);

						for (var i = 0; i < this._data.length; i++) {
							this._drawColumn(this._data[i], i);
						}
					}
				}, {
					key: "_drawColumn",
					value: function _drawColumn(value, index) {
						var boxSize = Math.ceil(this._node.width / this._options.bins);
						var count = Math.round(this._node.height / boxSize * (value / 255));
						var padding = 2;

						for (var i = 0; i < count; i++) {
							this._ctx.fillRect(padding + index * boxSize, this._node.height - i * boxSize, boxSize - padding, boxSize - padding);
						}
					}
				}]);

				return Spectrum;
			}(Vis);

			_export("default", Spectrum);
		}
	};
});

"use strict";

System.register("platform.js", [], function (_export, _context) {
	var search, argv, baseURI;
	return {
		setters: [],
		execute: function () {
			search = location.search.substring(1);

			_export("argv", argv = (search ? search.split("&") : []).map(decodeURIComponent));

			_export("argv", argv);

			function showDevTools() {}

			_export("showDevTools", showDevTools);

			function setFullscreen(fullscreen) {
				return fullscreen;
			}

			_export("setFullscreen", setFullscreen);

			_export("baseURI", baseURI = document.baseURI);

			_export("baseURI", baseURI);

			function onOpen(callback) {
				window.addEventListener("message", function (e) {
					if (e.data && e.data.command == "control") {
						callback(e.data.argv, baseURI);
					}
				});
			}

			_export("onOpen", onOpen);

			function globalShortcut(shortcut, cb) {}

			_export("globalShortcut", globalShortcut);

			function resizeBy(dw, dh) {
				window.resizeBy(dw, dh);
			}

			_export("resizeBy", resizeBy);
		}
	};
});

"use strict";

System.import("app.js").catch(function (e) {
  return console.error(e.message);
});

