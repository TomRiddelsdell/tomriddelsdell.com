#!/bin/bash

# AWS Cost Calculator for tomriddelsdell.com
# Helps estimate monthly AWS costs based on usage patterns
# 
# Usage: ./infrastructure/deployment/aws/scripts/aws-cost-calculator.sh

set -euo pipefail

# Color output functions
red() { echo -e "\033[31m$*\033[0m"; }
green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
blue() { echo -e "\033[34m$*\033[0m"; }
bold() { echo -e "\033[1m$*\033[0m"; }

echo "$(blue '💰 AWS Cost Calculator for tomriddelsdell.com')"
echo "$(blue '=================================================')"
echo ""

# Get user inputs
echo "Please provide your expected usage patterns:"
echo ""

read -p "Monthly website visitors: " visitors
read -p "Average page views per visitor: " page_views
read -p "API requests per page view: " api_requests
read -p "Average Lambda execution time (ms): " lambda_duration
read -p "Database type (neon/rds): " db_type
read -p "Environment (development/production): " environment

echo ""
echo "$(yellow 'Calculating costs for EU-West-2 region...')"
echo ""

# Calculate monthly totals
monthly_page_views=$((visitors * page_views))
monthly_api_requests=$((monthly_page_views * api_requests))
monthly_lambda_invocations=$monthly_api_requests
monthly_s3_requests=$((monthly_page_views * 3)) # HTML, CSS, JS
monthly_cloudfront_requests=$((monthly_page_views * 5)) # All assets

# AWS Pricing (EU-West-2, as of 2025)
# Lambda pricing
lambda_free_tier_requests=1000000
lambda_free_tier_gb_seconds=400000
lambda_memory_gb=$(echo "0.512" | bc -l) # 512MB = 0.512GB
lambda_duration_seconds=$(echo "$lambda_duration / 1000" | bc -l)
lambda_gb_seconds=$((monthly_lambda_invocations * lambda_memory_gb * lambda_duration_seconds))

if [ $monthly_lambda_invocations -gt $lambda_free_tier_requests ]; then
    billable_requests=$((monthly_lambda_invocations - lambda_free_tier_requests))
    lambda_request_cost=$(echo "$billable_requests * 0.0000002" | bc -l)
else
    lambda_request_cost=0
fi

if [ $(echo "$lambda_gb_seconds > $lambda_free_tier_gb_seconds" | bc) -eq 1 ]; then
    billable_gb_seconds=$(echo "$lambda_gb_seconds - $lambda_free_tier_gb_seconds" | bc -l)
    lambda_compute_cost=$(echo "$billable_gb_seconds * 0.000017" | bc -l)
else
    lambda_compute_cost=0
fi

lambda_total_cost=$(echo "$lambda_request_cost + $lambda_compute_cost" | bc -l)

# API Gateway pricing
api_free_tier=1000000
if [ $monthly_api_requests -gt $api_free_tier ]; then
    billable_api_requests=$((monthly_api_requests - api_free_tier))
    api_gateway_cost=$(echo "$billable_api_requests * 0.0000034" | bc -l)
else
    api_gateway_cost=0
fi

# S3 pricing
s3_storage_gb=1 # Assume 1GB for static assets
s3_free_tier_storage=5
s3_free_tier_requests=20000

if [ $(echo "$s3_storage_gb > $s3_free_tier_storage" | bc) -eq 1 ]; then
    billable_storage=$(echo "$s3_storage_gb - $s3_free_tier_storage" | bc -l)
    s3_storage_cost=$(echo "$billable_storage * 0.024" | bc -l)
else
    s3_storage_cost=0
fi

if [ $monthly_s3_requests -gt $s3_free_tier_requests ]; then
    billable_s3_requests=$((monthly_s3_requests - s3_free_tier_requests))
    s3_request_cost=$(echo "$billable_s3_requests * 0.0000004" | bc -l)
else
    s3_request_cost=0
fi

s3_total_cost=$(echo "$s3_storage_cost + $s3_request_cost" | bc -l)

# CloudFront pricing
cf_free_tier_data=1099511627776 # 1TB in bytes
cf_free_tier_requests=10000000
estimated_data_transfer=$((monthly_page_views * 2097152)) # 2MB per page

if [ $estimated_data_transfer -gt $cf_free_tier_data ]; then
    billable_data_gb=$(echo "($estimated_data_transfer - $cf_free_tier_data) / 1073741824" | bc -l)
    cf_data_cost=$(echo "$billable_data_gb * 0.085" | bc -l)
else
    cf_data_cost=0
fi

if [ $monthly_cloudfront_requests -gt $cf_free_tier_requests ]; then
    billable_cf_requests=$((monthly_cloudfront_requests - cf_free_tier_requests))
    cf_request_cost=$(echo "$billable_cf_requests * 0.0000012" | bc -l)
else
    cf_request_cost=0
fi

cloudfront_total_cost=$(echo "$cf_data_cost + $cf_request_cost" | bc -l)

# Route 53
route53_cost=0.50

# CloudWatch (basic monitoring)
if [ "$environment" = "production" ]; then
    cloudwatch_cost=5.00
else
    cloudwatch_cost=2.00
fi

# Database costs
if [ "$db_type" = "rds" ]; then
    if [ "$environment" = "production" ]; then
        database_cost=25.00
    else
        database_cost=15.00
    fi
else
    database_cost=0 # Assuming external Neon database
fi

# Calculate totals
aws_services_cost=$(echo "$lambda_total_cost + $api_gateway_cost + $s3_total_cost + $cloudfront_total_cost + $route53_cost + $cloudwatch_cost" | bc -l)
total_monthly_cost=$(echo "$aws_services_cost + $database_cost" | bc -l)

# Display results
echo "$(bold '📊 Monthly Usage Estimates:')"
echo "Monthly visitors: $(yellow "$visitors")"
echo "Monthly page views: $(yellow "$monthly_page_views")"
echo "Monthly API requests: $(yellow "$monthly_api_requests")"
echo "Monthly Lambda invocations: $(yellow "$monthly_lambda_invocations")"
echo ""

echo "$(bold '💵 AWS Cost Breakdown:')"
printf "Lambda Functions:      %s$%.2f%s\n" "$(green)" "$lambda_total_cost" "$(tput sgr0)"
printf "API Gateway:           %s$%.2f%s\n" "$(green)" "$api_gateway_cost" "$(tput sgr0)"
printf "S3 Storage:            %s$%.2f%s\n" "$(green)" "$s3_total_cost" "$(tput sgr0)"
printf "CloudFront CDN:        %s$%.2f%s\n" "$(green)" "$cloudfront_total_cost" "$(tput sgr0)"
printf "Route 53 DNS:          %s$%.2f%s\n" "$(green)" "$route53_cost" "$(tput sgr0)"
printf "CloudWatch Monitoring: %s$%.2f%s\n" "$(green)" "$cloudwatch_cost" "$(tput sgr0)"
if [ "$db_type" = "rds" ]; then
    printf "RDS Database:          %s$%.2f%s\n" "$(green)" "$database_cost" "$(tput sgr0)"
else
    printf "External Database:     %s$%.2f%s (Neon/external)\n" "$(green)" "$database_cost" "$(tput sgr0)"
fi
echo "$(blue '─────────────────────')"
printf "Total Monthly Cost:    %s$%.2f%s\n" "$(bold)$(green)" "$total_monthly_cost" "$(tput sgr0)"
echo ""

# Comparison with Replit
replit_cost=20.00
savings=$(echo "$replit_cost - $total_monthly_cost" | bc -l)
if [ $(echo "$savings > 0" | bc) -eq 1 ]; then
    printf "Savings vs Replit:     %s$%.2f/month%s\n" "$(green)" "$savings" "$(tput sgr0)"
    percentage_savings=$(echo "scale=1; $savings / $replit_cost * 100" | bc -l)
    printf "Percentage savings:    %s%.1f%%%s\n" "$(green)" "$percentage_savings" "$(tput sgr0)"
else
    additional_cost=$(echo "$total_monthly_cost - $replit_cost" | bc -l)
    printf "Additional cost:       %s$%.2f/month%s\n" "$(red)" "$additional_cost" "$(tput sgr0)"
fi
echo ""

# Free tier benefits
echo "$(bold '🆓 Free Tier Benefits (First 12 months):')"
echo "• Lambda: 1M requests + 400K GB-seconds free"
echo "• API Gateway: 1M API calls free"
echo "• S3: 5GB storage + 20K GET requests free"
echo "• CloudFront: 1TB data transfer + 10M requests free"
echo ""

# Recommendations
echo "$(bold '💡 Cost Optimization Recommendations:')"
echo ""

if [ $(echo "$lambda_total_cost > 5" | bc) -eq 1 ]; then
    echo "$(yellow '• Consider optimizing Lambda cold starts and memory usage')"
fi

if [ $(echo "$monthly_api_requests > 5000000" | bc) -eq 1 ]; then
    echo "$(yellow '• Consider API Gateway caching for frequently accessed endpoints')"
fi

if [ "$db_type" = "rds" ] && [ "$environment" = "development" ]; then
    echo "$(yellow '• Consider using Neon for development to reduce database costs')"
fi

if [ $(echo "$cloudfront_total_cost > 10" | bc) -eq 1 ]; then
    echo "$(yellow '• Consider optimizing asset sizes and enabling compression')"
fi

echo "$(green '• Set up billing alerts at $10, $25, and $50 thresholds')"
echo "$(green '• Monitor usage with AWS Cost Explorer weekly')"
echo "$(green '• Use resource tagging for cost allocation')"
echo ""

echo "$(blue 'Note: Prices are estimates based on AWS EU-West-2 pricing as of 2025.')"
echo "$(blue 'Actual costs may vary based on usage patterns and AWS pricing changes.')"
echo ""
echo "$(bold 'Ready to deploy? Run: npm run aws:deploy:prod')"
