#!/bin/bash

# CloudFormation Template Validation Script
# Validates templates without deploying them

set -euo pipefail

# Colors
red() { echo -e "\033[31m$*\033[0m"; }
green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue() { echo -e "\033[34m$*\033[0m"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/../infrastructure/deployment/aws/cloudformation"

echo "$(blue '🔍 Validating CloudFormation Templates')"
echo "======================================"

# Validate staging template
echo ""
echo "$(yellow 'Validating staging template...')"
if aws cloudformation validate-template --template-body file://"$TEMPLATE_DIR/staging-stack.yml" >/dev/null 2>&1; then
    echo "$(green '✅ Staging template is valid')"
else
    echo "$(red '❌ Staging template validation failed:')"
    aws cloudformation validate-template --template-body file://"$TEMPLATE_DIR/staging-stack.yml" 2>&1 || true
fi

# Validate production template
echo ""
echo "$(yellow 'Validating production template...')"
if aws cloudformation validate-template --template-body file://"$TEMPLATE_DIR/production-stack.yml" >/dev/null 2>&1; then
    echo "$(green '✅ Production template is valid')"
else
    echo "$(red '❌ Production template validation failed:')"
    aws cloudformation validate-template --template-body file://"$TEMPLATE_DIR/production-stack.yml" 2>&1 || true
fi

echo ""
echo "$(blue '📋 Template validation complete')"