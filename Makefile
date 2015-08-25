define BUNDLE_OPTS
	./ sparc \
	--version=0.31.0 --out=dist \
	--icon=IconTemplate.png \
	--cache=/tmp --overwrite \
	--app-version=1.0.0 \
	--ignore dist
endef
export BUNDLE_OPTS

define LINUX_OPTS
	$(BUNDLE_OPTS) \
	--platform=linux --arch=x64
endef
export LINUX_OPTS
dist-linux:
	electron-packager $(LINUX_OPTS)
	zip -r dist/sparc-linux-x64.zip dist/sparc-linux-x64

define DARWIN_OPTS
	$(BUNDLE_OPTS) \
	--platform=darwin --arch=x64 \
	--app-bundle-id=com.ox.sparc \
	--helper-bundle-id=SparcHelper
endef
export DARWIN_OPTS
dist-darwin:
	electron-packager $(DARWIN_OPTS)
	zip -r dist/sparc-darwin-x64.zip dist/sparc-darwin-x64

dist: dist-linux dist-darwin

clean:
	rm -r dist
