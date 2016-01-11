BABEL := ../node_modules/babel-cli/bin/babel.js --presets es2015
BABEL_MODULES := -M --plugins transform-es2015-modules-systemjs
ES6 := es6
ES5 := es5

FILES_APP := $(shell find $(ES6)/app -name '*.js' | sed 's/$(ES6)\///')

FILES_WEB := \
	polyfills/system-polyfill.min.js \
	$(addprefix $(ES5)/,$(FILES_APP) platform/platform-web.js load.js) 

FILES_ELECTRON := \
	polyfills/system-polyfill.min.js \
	$(addprefix $(ES5)/,$(FILES_APP) platform/platform-electron.js load.js) 

FILES_NW := \
	polyfills/object.assign.js \
	polyfills/system-polyfill.min.js \
	$(addprefix $(ES5)/,$(FILES_APP) platform/platform-nw.js load.js) 

all: electron nw web

# bundling

web: web.main.js web.app.js
electron: electron.main.js electron.app.js
nw: nw.app.js

electron.main.js: $(ES5)/platform/electron.main.js
	cp $^ $@

electron.app.js: $(FILES_ELECTRON)
	cat $^ > $@

web.main.js: $(ES5)/platform/web.main.js
	cp $^ $@

web.app.js: $(FILES_WEB)
	cat $^ > $@

nw.app.js: $(FILES_NW)
	cat $^ > $@

# transpilation

# app files with real module ids
$(ES5)/app/%: $(ES6)/app/%
	mkdir -p $(dir $@)
	$(BABEL) $(BABEL_MODULES) --module-id $* $^ > $@

# platform files with fake module id
$(ES5)/platform/platform-%: $(ES6)/platform/platform-%
	mkdir -p $(dir $@)
	$(BABEL) $(BABEL_MODULES) --module-id platform.js $^ > $@

# fallback for simply transpiled files without modules
$(ES5)/%: $(ES6)/%
	mkdir -p $(dir $@)
	$(BABEL) $^ > $@

clean:
	rm -rf $(ES5) *.js

.PHONY: all clean electron nw
