.DEFAULT_GOAL := release

VERSION   := $(shell node scripts/build_version.mjs latest-tag 2>/dev/null || echo unknown)
ROOT_DIR  := $(CURDIR)
BUILD_DIR := $(ROOT_DIR)/build
CLI_DIR   := $(ROOT_DIR)/apps/cli
FFMPEG_VERSION ?= unknown

define build_cli
	cd $(CLI_DIR) && CGO_ENABLED=0 GOOS=$(1) GOARCH=$(2) go build -tags prod -ldflags "-X cicada/internal/version.Version=$(VERSION)" -o $(3) .
endef

define stage_ffmpeg_bundle
	node scripts/prepare_ffmpeg_bundle.mjs --target $(1) --version "$(FFMPEG_VERSION)" $(if $($(2)),--archive "$($(2))") $(if $($(3)),--sha256 "$($(3))")
endef

.PHONY: pwa release docker clean ffmpeg-bundles ffmpeg-bundle-darwin-arm64 ffmpeg-bundle-darwin-amd64 ffmpeg-bundle-windows-amd64 ffmpeg-bundle-windows-arm64 ffmpeg-bundle-linux-amd64 ffmpeg-bundle-linux-arm64

## 构建 PWA 并嵌入 CLI
pwa:
	npm ci --prefix apps/pwa
	CICADA_VERSION=$(VERSION) npm run build --prefix apps/pwa
	rm -rf $(CLI_DIR)/pwa/dist
	cp -R apps/pwa/dist $(CLI_DIR)/pwa/dist

ffmpeg-bundle-darwin-arm64:
	$(call stage_ffmpeg_bundle,darwin-arm64,FFMPEG_ARCHIVE_DARWIN_ARM64,FFMPEG_SHA256_DARWIN_ARM64)

ffmpeg-bundle-darwin-amd64:
	$(call stage_ffmpeg_bundle,darwin-amd64,FFMPEG_ARCHIVE_DARWIN_AMD64,FFMPEG_SHA256_DARWIN_AMD64)

ffmpeg-bundle-windows-amd64:
	$(call stage_ffmpeg_bundle,windows-amd64,FFMPEG_ARCHIVE_WINDOWS_AMD64,FFMPEG_SHA256_WINDOWS_AMD64)

ffmpeg-bundle-windows-arm64:
	$(call stage_ffmpeg_bundle,windows-arm64,FFMPEG_ARCHIVE_WINDOWS_ARM64,FFMPEG_SHA256_WINDOWS_ARM64)

ffmpeg-bundle-linux-amd64:
	$(call stage_ffmpeg_bundle,linux-amd64,FFMPEG_ARCHIVE_LINUX_AMD64,FFMPEG_SHA256_LINUX_AMD64)

ffmpeg-bundle-linux-arm64:
	$(call stage_ffmpeg_bundle,linux-arm64,FFMPEG_ARCHIVE_LINUX_ARM64,FFMPEG_SHA256_LINUX_ARM64)

ffmpeg-bundles: \
	ffmpeg-bundle-darwin-arm64 \
	ffmpeg-bundle-darwin-amd64 \
	ffmpeg-bundle-windows-amd64 \
	ffmpeg-bundle-windows-arm64 \
	ffmpeg-bundle-linux-amd64 \
	ffmpeg-bundle-linux-arm64

## 全平台构建发布包 (默认目标)
release: pwa ffmpeg-bundles
	rm -rf $(BUILD_DIR)
	mkdir -p $(BUILD_DIR)
	mkdir -p $(BUILD_DIR)/darwin-arm64
	$(call build_cli,darwin,arm64,$(BUILD_DIR)/darwin-arm64/cicada)
	cd $(BUILD_DIR)/darwin-arm64 && tar -zcf ../cicada-$(VERSION)-darwin-arm64.tar.gz cicada
	mkdir -p $(BUILD_DIR)/darwin-amd64
	$(call build_cli,darwin,amd64,$(BUILD_DIR)/darwin-amd64/cicada)
	cd $(BUILD_DIR)/darwin-amd64 && tar -zcf ../cicada-$(VERSION)-darwin-amd64.tar.gz cicada
	mkdir -p $(BUILD_DIR)/windows-amd64
	$(call build_cli,windows,amd64,$(BUILD_DIR)/windows-amd64/cicada.exe)
	cd $(BUILD_DIR)/windows-amd64 && tar -zcf ../cicada-$(VERSION)-windows-amd64.tar.gz cicada.exe
	mkdir -p $(BUILD_DIR)/windows-arm64
	$(call build_cli,windows,arm64,$(BUILD_DIR)/windows-arm64/cicada.exe)
	cd $(BUILD_DIR)/windows-arm64 && tar -zcf ../cicada-$(VERSION)-windows-arm64.tar.gz cicada.exe
	mkdir -p $(BUILD_DIR)/linux-amd64
	$(call build_cli,linux,amd64,$(BUILD_DIR)/linux-amd64/cicada)
	cd $(BUILD_DIR)/linux-amd64 && tar -zcf ../cicada-$(VERSION)-linux-amd64.tar.gz cicada
	mkdir -p $(BUILD_DIR)/linux-arm64
	$(call build_cli,linux,arm64,$(BUILD_DIR)/linux-arm64/cicada)
	cd $(BUILD_DIR)/linux-arm64 && tar -zcf ../cicada-$(VERSION)-linux-arm64.tar.gz cicada
	rm -rf \
		$(BUILD_DIR)/darwin-arm64    \
		$(BUILD_DIR)/darwin-amd64    \
		$(BUILD_DIR)/windows-amd64   \
		$(BUILD_DIR)/windows-arm64   \
		$(BUILD_DIR)/linux-amd64     \
		$(BUILD_DIR)/linux-arm64

## 构建 Linux 多架构二进制 (供 Docker buildx 使用, 不压缩)
docker: pwa ffmpeg-bundle-linux-amd64 ffmpeg-bundle-linux-arm64
	rm -rf $(BUILD_DIR)
	mkdir -p $(BUILD_DIR)/linux-amd64
	$(call build_cli,linux,amd64,$(BUILD_DIR)/linux-amd64/cicada)
	mkdir -p $(BUILD_DIR)/linux-arm64
	$(call build_cli,linux,arm64,$(BUILD_DIR)/linux-arm64/cicada)
	@echo 'skip compression on docker building.'

## 清理构建产物
clean:
	rm -rf $(BUILD_DIR) apps/cli/pwa/dist apps/pwa/dist apps/cli/internal/ffmpeg/generated apps/cli/internal/ffmpeg/zz_bundle_*.go
