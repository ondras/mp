MAIN := app.css

all: $(MAIN)

$(MAIN): $(shell find less)
	lessc less/app.less $@

clean:
	rm -rf $(MAIN)

.PHONY: all clean
