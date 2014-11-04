
build: components lib/index.js
	@component build --dev

components: component.json
	@component install --dev

install: components build/build.js
	component build --standalone minimum_rpc --out . --name _index

clean:
	rm -fr build components template.js

.PHONY: clean
