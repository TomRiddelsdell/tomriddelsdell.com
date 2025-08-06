#!/bin/bash
# DevContainer Security Validation Script
# Run this before committing to ensure no credentials are exposed

echo "🔒 DevContainer Security Validation"
echo "=================================="

# Check for hardcoded credentials in devcontainer files
echo "🔍 Checking for hardcoded credentials..."

SECURITY_VIOLATIONS=0

# Function to check for security violations
check_file() {
    local file="$1"
    local violations
    
    if [ -f "$file" ]; then
        echo "  Checking: $file"
        
        # Check for hardcoded secrets (not using ${localEnv:} pattern)
        violations=$(grep -E '(password|secret|key|token|credential).*(:|=).*[^}]$' "$file" | grep -v '${localEnv:' | grep -v '# TEMPLATE' | grep -v '//.*TEMPLATE')
        
        if [ -n "$violations" ]; then
            echo "  ❌ SECURITY VIOLATION: Hardcoded credentials found in $file"
            echo "$violations"
            SECURITY_VIOLATIONS=$((SECURITY_VIOLATIONS + 1))
        else
            echo "  ✅ No hardcoded credentials found"
        fi
    fi
}

# Check devcontainer files
check_file ".devcontainer/devcontainer.json"
check_file ".devcontainer/docker-compose.yml"

# Check MCP config files for sensitive data
echo "🔍 Checking MCP configuration files..."
find .devcontainer/mcp-config -name "*.json" -type f | while read -r file; do
    check_file "$file"
done

# Check for leaked environment files
echo "🔍 Checking for leaked environment files..."
if git ls-files | grep -E '\.env$' | grep -v -E '\.(template|example)$' | grep -q .; then
    echo "  ❌ WARNING: .env files found in Git repository"
    git ls-files | grep -E '\.env$' | grep -v -E '\.(template|example)$'
    SECURITY_VIOLATIONS=$((SECURITY_VIOLATIONS + 1))
else
    echo "  ✅ No .env files found in Git repository (templates/examples are OK)"
fi

# Check for AWS credentials files
echo "🔍 Checking for AWS credentials..."
if git ls-files | grep -E 'credentials$|aws.*credential.*\.(json|txt|key)$' | grep -q .; then
    echo "  ❌ WARNING: AWS credential files found in Git repository"
    git ls-files | grep -E 'credentials$|aws.*credential.*\.(json|txt|key)$'
    SECURITY_VIOLATIONS=$((SECURITY_VIOLATIONS + 1))
else
    echo "  ✅ No AWS credential files found in Git repository"
fi

# Final result
echo ""
echo "🏁 Security Validation Complete"
echo "==============================="

if [ $SECURITY_VIOLATIONS -eq 0 ]; then
    echo "✅ PASS: No security violations detected"
    echo "Your devcontainer configuration is secure for Git commits"
    exit 0
else
    echo "❌ FAIL: $SECURITY_VIOLATIONS security violation(s) detected"
    echo "Please fix the issues above before committing"
    exit 1
fi
