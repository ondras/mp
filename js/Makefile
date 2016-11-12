SOURCES := $(shell find src -name '*.js')

all: electron nw web

web: web.main.js web.app.js
electron: electron.main.js electron.app.js
nw: nw.app.js

# rollup bundles

electron.app.js: $(SOURCES)
	PLATFORM=electron npm run -s rollup > $@

nw.app.js: $(SOURCES)
	PLATFORM=nw npm run -s rollup > $@

web.app.js: $(SOURCES)
	PLATFORM=web npm run -s rollup > $@

# individual main scripts

electron.main.js: src/platform/electron.main.js
	cp $^ $@

web.main.js: src/platform/web.main.js
	cp $^ $@

# misc

clean:
	rm -rf *.main.js *.app.js

.PHONY: all clean electron nw web
