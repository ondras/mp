ELECTRON := dist/electron
NW := dist/nw
WEB := dist/web
COMMON := package.json html/player.html css/app.css icon.png css/font

all: electron nw web

electron:
	$(MAKE) -C css
	$(MAKE) -C js electron
	mkdir -p $(ELECTRON)
	cp -r $(COMMON) $(ELECTRON)
	cp js/electron.app.js $(ELECTRON)/app.js
	cp js/electron.main.js $(ELECTRON)/main.js
	cp bin/mp-electron.sh $(ELECTRON)/mp.sh
	cp bin/mp-electron.bat $(ELECTRON)/mp.bat
	cp bin/install.bat $(ELECTRON)
	ln -f -r -s sample $(ELECTRON)

nw:
	$(MAKE) -C css
	$(MAKE) -C js nw
	mkdir -p $(NW)
	cp -r $(COMMON) $(NW)
	cp js/nw.app.js $(NW)/app.js
	cp bin/mp-nw.sh $(NW)/mp.sh
	ln -f -r -s sample $(NW)

web:
	$(MAKE) -C css
	$(MAKE) -C js web
	mkdir -p $(WEB)
	cp -r $(COMMON) $(WEB)
	cp html/index.html $(WEB)
	cp js/web.app.js $(WEB)/app.js
	cp js/web.main.js $(WEB)/main.js
	ln -f -r -s sample $(WEB)

watch: all
	while inotifywait -e MODIFY -r html bin css/src js/src ; do make $^ ; done

clean:
	rm -rf dist
	$(MAKE) -C css clean
	$(MAKE) -C js clean

.PHONY: all electron nw web watch clean
