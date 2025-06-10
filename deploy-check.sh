#!/bin/bash

# Efficient pre-deployment validation
set -e

echo "Deployment Validation"
echo "===================="

# Environment validation
echo "Checking environment..."
if [ -z "$DATABASE_URL" ] || [ -z "$SESSION_SECRET" ]; then
  echo "ERROR: Missing critical environment variables"
  exit 1
fi

if [ -z "$VITE_AWS_COGNITO_USER_POOL_ID" ]; then
  echo "ERROR: Cognito configuration missing"
  exit 1
fi

echo "Environment OK"

# Server connectivity test
echo "Testing server connectivity..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/auth/me)
if [ "$HTTP_STATUS" = "401" ]; then
  echo "Server responding"
else
  echo "ERROR: Server not accessible (HTTP $HTTP_STATUS)"
  exit 1
fi

# Basic API functionality test
echo "Testing core APIs..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/signout)
if echo "$RESPONSE" | grep -q "cognitoLogoutUrl"; then
  echo "Authentication system operational"
else
  echo "ERROR: Authentication system not responding properly"
  exit 1
fi

echo ""
echo "Deployment validation complete - ready to deploy"
exit 0