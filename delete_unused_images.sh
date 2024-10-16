#!/bin/bash

# Directory containing the images
IMAGE_DIR="/workspaces/tomriddelsdell.com/src/images"

# Directory containing the codebase
CODEBASE_DIR="/workspaces/tomriddelsdell.com"

# List all image files in the IMAGE_DIR
for image in "$IMAGE_DIR"/*; do
  image_name=$(basename "$image")
  image_name_no_ext="${image_name%.*}" # Remove the file extension

  # Search for references to the image in the CODEBASE_DIR
  TPR_IF=! grep -riq "$image_name_no_ext" "$CODEBASE_DIR"
  echo "checking: $image_name...found: $TPR_IF"
  if ! grep -riq "$image_name_no_ext" "$CODEBASE_DIR"; then
    echo "Unused image: $image_name"
  fi
done