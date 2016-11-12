MAIN := app.css

all: $(MAIN)

$(MAIN): $(shell find src)
	npm run -s lessc > $@

clean:
	rm -rf $(MAIN)

.PHONY: all clean
