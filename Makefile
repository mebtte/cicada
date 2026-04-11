.DEFAULT_GOAL := release

VERSION   := $(shell git describe --abbrev=0 --tags 2>/dev/null || echo dev)
ROOT_DIR  := $(CURDIR)
BUILD_DIR := $(ROOT_DIR)/build
CLI_DIR   := $(ROOT_DIR)/apps/cli

define build_cli
	cd $(CLI_DIR) && CGO_ENABLED=0 GOOS=$(1) GOARCH=$(2) go build -tags prod -o $(3) .
endef

.PHONY: pwa release docker clean

## 构建 PWA 并嵌入 CLI
pwa:
	npm ci --prefix apps/pwa
	npm run build --prefix apps/pwa
	rm -rf $(CLI_DIR)/pwa/dist
	cp -R apps/pwa/dist $(CLI_DIR)/pwa/dist

## 全平台构建发布包 (默认目标)
release: pwa
	mkdir -p $(BUILD_DIR)
	$(call build_cli,darwin,arm64,$(BUILD_DIR)/cicada-darwin-arm64)
	$(call build_cli,darwin,amd64,$(BUILD_DIR)/cicada-darwin-amd64)
	$(call build_cli,windows,amd64,$(BUILD_DIR)/cicada-windows-amd64.exe)
	$(call build_cli,windows,arm64,$(BUILD_DIR)/cicada-windows-arm64.exe)
	$(call build_cli,linux,amd64,$(BUILD_DIR)/cicada-linux-amd64)
	$(call build_cli,linux,arm64,$(BUILD_DIR)/cicada-linux-arm64)
	cd $(BUILD_DIR) && \
		tar -zcf cicada-macos-arm-$(VERSION).tar.gz  cicada-darwin-arm64       && \
		tar -zcf cicada-macos-x64-$(VERSION).tar.gz  cicada-darwin-amd64       && \
		tar -zcf cicada-windows-x64-$(VERSION).tar.gz cicada-windows-amd64.exe && \
		tar -zcf cicada-windows-arm-$(VERSION).tar.gz cicada-windows-arm64.exe && \
		tar -zcf cicada-linux-x64-$(VERSION).tar.gz  cicada-linux-amd64        && \
		tar -zcf cicada-linux-arm-$(VERSION).tar.gz  cicada-linux-arm64
	rm \
		$(BUILD_DIR)/cicada-darwin-arm64       \
		$(BUILD_DIR)/cicada-darwin-amd64       \
		$(BUILD_DIR)/cicada-windows-amd64.exe  \
		$(BUILD_DIR)/cicada-windows-arm64.exe  \
		$(BUILD_DIR)/cicada-linux-amd64        \
		$(BUILD_DIR)/cicada-linux-arm64

## 构建 Linux x64 二进制 (供 Docker 使用, 不压缩)
docker: pwa
	mkdir -p $(BUILD_DIR)
	$(call build_cli,linux,amd64,$(BUILD_DIR)/cicada)
	@echo 'skip compression on docker building.'

## 清理构建产物
clean:
	rm -rf $(BUILD_DIR) apps/cli/pwa/dist apps/pwa/dist
