#!/usr/bin/env bash
set -e

CONFIG_JSON="config.json"
if [ ! -f $CONFIG_JSON ]; then
  echo "{}" >>$CONFIG_JSON
fi
