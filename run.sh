#!/usr/bin/env bash
set -e

echo "▶ Recording..."
node record-str.js

WEBM=$(ls -t videos/*.webm | head -1)
echo "▶ Converting: $WEBM"
ffmpeg -y -i "$WEBM" -vcodec libx264 -acodec aac videos/output.mp4

echo "✓ Done → videos/output.mp4"
