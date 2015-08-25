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
	--platform=linux --arch=all
endef
export LINUX_OPTS
linux:
	electron-packager $(LINUX_OPTS)

define DARWIN_OPTS
	$(BUNDLE_OPTS) \
	--platform=darwin --arch=all \
	--app-bundle-id=com.ox.sparc \
	--helper-bundle-id=SparcHelper
endef
export DARWIN_OPTS
darwin:
	electron-packager $(DARWIN_OPTS)

all: linux darwin

clean:
	rm -r dist
