import * as id3v1 from "./id3v1.js";
import * as id3v2 from "./id3v2.js";
import * as ogg from "./ogg.js";
import * as mp4 from "./mp4.js";

DataView.prototype.getString = function(offset, length, encoding) {
	let decoder = new TextDecoder(encoding);
	let view = this.buffer.slice(this.byteOffset + offset, this.byteOffset + offset + length);
	return decoder.decode(view);
}

DataView.prototype.slice = function(start, end) {
	if (arguments.length < 2) { end = this.byteLength; }
	
	return new DataView(this.buffer, this.byteOffset + start, end - start);
}

DataView.prototype.getUint32ss = function(offset) {
	return this.getInt8(offset + 3) & 0x7f
		 | ((this.getInt8(offset + 2)) << 7)
		 | ((this.getInt8(offset + 1)) << 14)
		 | (this.getInt8(offset) << 21);
}


const decoders = [id3v2, id3v1, ogg, mp4];

export default function metadata(arrayBuffer) {
	for (let decoder of decoders) {
		if (decoder.accepts(arrayBuffer)) {
			return decoder.decode(arrayBuffer);
		}
	}
	return null;
}
