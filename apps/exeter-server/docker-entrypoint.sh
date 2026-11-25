#!/bin/sh
set -eu

# The bind mount supplies its own ownership. Give node write access before starting Exeter.
chown node:node /app/diagram-sources
exec su-exec node:node "$@"
