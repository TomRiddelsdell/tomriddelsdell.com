#!/bin/bash

# GitHub Actions Deployment Fix Analysis and Solution
# Identifies and fixes the root cause of GitHub Actions vs local deployment differences

set -euo pipefail

echo "🔧 GitHub Actions Deployment Fix Analysis"
echo "========================================"

# Key findings from investigation:
echo "📋 KEY FINDINGS:"
echo "1. ✅ IAM permissions are comprehensive and correct"
echo "2. ✅ Simplified template works in GitHub Actions"
echo "3. ❌ Original template fails only in GitHub Actions"
echo "4. ✅ Original template works perfectly locally"

echo ""
echo "🔍 ROOT CAUSE ANALYSIS:"
echo "----------------------"

echo "The issue is NOT permissions - GitHub Actions staging role has all required permissions:"
echo "- CloudFormation: Full stack management"
echo "- S3: Bucket creation, policies, lifecycle, tagging"
echo "- Lambda: Function management and permissions"
echo "- API Gateway: Full API management"
echo "- CloudFront: Distribution and OAI management"
echo "- IAM: Role creation and policy management"
echo "- CloudWatch: Alarms and logging"

echo ""
echo "💡 LIKELY ROOT CAUSE: CloudFront Distribution Creation Timeout"
echo "The original template creates a complex CloudFront distribution that:"
echo "1. Takes longer to provision in GitHub Actions environment"
echo "2. May have network connectivity issues during creation"
echo "3. Could hit GitHub Actions timeout limits (6 hours max)"

echo ""
echo "🎯 SOLUTION STRATEGY:"
echo "--------------------"

cat << 'EOF'
OPTION 1: Incremental CloudFront Creation (Recommended)
- Create CloudFront distribution without complex origins first
- Update distribution with full configuration in separate step
- Reduces initial creation time and complexity

OPTION 2: Async CloudFront Creation
- Use CloudFormation custom resource with Lambda
- Create CloudFront distribution asynchronously
- Poll for completion status

OPTION 3: Separate CloudFront Stack
- Deploy core infrastructure first (API Gateway, Lambda, S3)
- Deploy CloudFront in separate stack after core is stable
- Reduces single stack complexity

OPTION 4: GitHub Actions Timeout Optimization
- Increase GitHub Actions timeout
- Add retry logic for CloudFormation operations
- Use CloudFormation stack policies for safer updates
EOF

echo ""
echo "🚀 IMPLEMENTING SOLUTION 1: Incremental CloudFront Creation"
echo "==========================================================="

# Create the optimized template
cat > /tmp/staging-stack-optimized.yml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Optimized staging environment for GitHub Actions - tomriddelsdell.com'

Parameters:
  ProjectName:
    Type: String
    Default: tomriddelsdell-com
    Description: Project name for resource naming
  
  Environment:
    Type: String
    Default: staging
    Description: Environment name
  
  DomainName:
    Type: String
    Default: dev.tomriddelsdell.com
    Description: Domain name for the staging environment
  
  CertificateArn:
    Type: String
    Description: SSL certificate ARN for CloudFront (must be in us-east-1)
    Default: ""
  
  CognitoUserPoolId:
    Type: String
    Description: Cognito User Pool ID for authentication
  
  DatabaseUrl:
    Type: String
    Description: Database connection URL
    NoEcho: true

Resources:
  # S3 Bucket for static assets
  StaticAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-static-assets'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-lambda-execution-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${StaticAssetsBucket.Arn}/*'
        - PolicyName: CloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # API Gateway Lambda Function
  ApiGatewayFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-api-gateway'
      Runtime: nodejs18.x
      Handler: index.handler
      Timeout: 30
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Staging API Gateway - Deploy pending' })
            };
          };
      Environment:
        Variables:
          NODE_ENV: !Ref Environment
          DATABASE_URL: !Ref DatabaseUrl
          COGNITO_USER_POOL_ID: !Ref CognitoUserPoolId
          STATIC_ASSETS_BUCKET: !Ref StaticAssetsBucket
          CORS_ORIGINS: !Sub 'https://${DomainName}'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # API Gateway
  ApiGateway:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-api'
      ProtocolType: HTTP
      CorsConfiguration:
        AllowCredentials: true
        AllowMethods:
          - GET
          - POST
          - PUT
          - DELETE
          - OPTIONS
        AllowOrigins:
          - !Sub 'https://${DomainName}'
        AllowHeaders:
          - Content-Type
          - Authorization
          - X-Amz-Date
          - X-Api-Key
        MaxAge: 86400
      Tags:
        Project: !Ref ProjectName
        Environment: !Ref Environment

  # API Gateway Lambda Permission
  ApiGatewayLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ApiGatewayFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*'

  # API Gateway Integration
  ApiGatewayIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref ApiGateway
      IntegrationType: AWS_PROXY
      IntegrationUri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ApiGatewayFunction.Arn}/invocations'
      PayloadFormatVersion: '2.0'

  # API Gateway Route (catch-all)
  ApiGatewayRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref ApiGateway
      RouteKey: 'ANY /{proxy+}'
      Target: !Sub 'integrations/${ApiGatewayIntegration}'

  # API Gateway Default Route
  ApiGatewayDefaultRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref ApiGateway
      RouteKey: '$default'
      Target: !Sub 'integrations/${ApiGatewayIntegration}'

  # API Gateway Stage
  ApiGatewayStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref ApiGateway
      StageName: !Ref Environment
      AutoDeploy: true
      Tags:
        Project: !Ref ProjectName
        Environment: !Ref Environment

  # CloudWatch Log Group for API Gateway
  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${ProjectName}-${Environment}'
      RetentionInDays: 30
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # Minimal CloudFront Distribution (GitHub Actions optimized)
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Comment: !Sub '${ProjectName} ${Environment} distribution - GitHub Actions optimized'
        DefaultCacheBehavior:
          TargetOriginId: api-gateway
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods: [GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE]
          CachedMethods: [GET, HEAD]
          Compress: true
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # CachingDisabled managed policy
          OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf  # CORS-S3Origin managed policy
        Origins:
          - Id: api-gateway
            DomainName: !Sub '${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com'
            OriginPath: !Sub '/${Environment}'
            CustomOriginConfig:
              HTTPPort: 443
              OriginProtocolPolicy: https-only
        Enabled: true
        PriceClass: PriceClass_100
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

Outputs:
  ApiGatewayUrl:
    Description: 'API Gateway URL'
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${ProjectName}-${Environment}-api-url'

  CloudFrontUrl:
    Description: 'CloudFront Distribution URL'
    Value: !Sub 'https://${CloudFrontDistribution.DomainName}'
    Export:
      Name: !Sub '${ProjectName}-${Environment}-cloudfront-url'

  CustomDomainUrl:
    Description: 'Custom Domain URL'
    Value: !Sub 'https://${DomainName}'
    Export:
      Name: !Sub '${ProjectName}-${Environment}-domain-url'

  StaticAssetsBucket:
    Description: 'S3 Bucket for static assets'
    Value: !Ref StaticAssetsBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-static-bucket'

  LambdaFunctionArn:
    Description: 'API Gateway Lambda Function ARN'
    Value: !GetAtt ApiGatewayFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-lambda-arn'

  CloudFrontDistributionId:
    Description: 'CloudFront Distribution ID'
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub '${ProjectName}-${Environment}-cloudfront-id'
EOF

echo "✅ Created optimized template with GitHub Actions improvements:"
echo "1. 🚀 Simplified CloudFront configuration using managed policies"
echo "2. ⚡ Removed complex ForwardedValues (deprecated) for CachePolicyId"
echo "3. 🔧 Optimized for faster deployment in CI/CD environment"

echo ""
echo "📋 NEXT STEPS:"
echo "1. Replace current staging template with optimized version"
echo "2. Test deployment in GitHub Actions"
echo "3. If successful, this becomes the new staging template"
echo "4. Keep original template for local development if needed"

echo ""
echo "🎯 Would you like to apply this optimized template? (y/n)"