#!/bin/bash

# Remove quarantine attributes from macOS app
# This script fixes the "app is damaged" issue on ARM Macs

APP_PATH="$1"

if [ -z "$APP_PATH" ]; then
    echo "Usage: $0 /path/to/app.app"
    exit 1
fi

if [ ! -d "$APP_PATH" ]; then
    echo "Error: App not found at $APP_PATH"
    exit 1
fi

echo "Removing quarantine attributes from: $APP_PATH"
xattr -cr "$APP_PATH"

if [ $? -eq 0 ]; then
    echo "Quarantine attributes removed successfully"
else
    echo "Error removing quarantine attributes"
    exit 1
fi
