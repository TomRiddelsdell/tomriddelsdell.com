#!/usr/bin/env bash
#
# Setup script for Git hooks
#

set -e

HOOKS_DIR=".githooks"

echo "Setting up Git hooks..."

# Make all hooks executable
chmod +x "$HOOKS_DIR"/*

# Configure Git to use the hooks directory
git config core.hooksPath "$HOOKS_DIR"

echo "✅ Git hooks configured successfully!"
echo ""
echo "Configured hooks:"
ls -1 "$HOOKS_DIR" | grep -v "README.md" | grep -v "setup.sh"
echo ""
echo "Hooks will run automatically. To bypass temporarily, use: git push --no-verify"
