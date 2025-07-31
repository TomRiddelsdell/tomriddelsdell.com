# Neptune Deployment Flow & Cost Management Guide

## ⚠️ **CRITICAL COST WARNING** ⚠️

**Amazon Neptune is NOT included in AWS Free Tier**
- **Minimum cost**: ~$0.074/hour ($54/month)
- **No free testing period**
- **Charges begin immediately upon deployment**
- **Auto-shutdown is CRITICAL to prevent runaway costs**

---

## 🚨 Cost Control Safety Measures

### **Mandatory Pre-Flight Checklist**
Before any deployment, verify:

- [ ] **Auto-shutdown configured** (1-hour maximum)
- [ ] **AWS billing alerts set** ($10, $25, $50 thresholds)
- [ ] **Emergency shutdown script tested**
- [ ] **Maximum session budget agreed** (~$0.074 per hour)
- [ ] **Calendar reminder set** for manual verification

### **Cost Breakdown**
```
Estimated Costs (EU-West-2):
├── Instance (db.t3.medium): $0.074/hour = $54/month
├── Storage: $0.10/GB/month (minimum ~$0.50)
├── I/O Operations: $0.20 per 1M requests
├── Backup Storage: $0.021/GB/month
└── Total Minimum: ~$0.074/hour = $55+/month
```

---

## 🔄 Neptune Deployment Flow

### **Phase 1: Pre-Deployment Setup**

#### 1.1 Environment Validation
```bash
# Verify MCP servers are healthy
curl http://aws-mcp:8001/health     # Should return: {"status":"healthy"...}
curl http://neptune-mcp:8002/health # Should return: {"status":"healthy"...}

# Verify AWS credentials
echo $AWS_ACCESS_KEY_ID      # Should show: AKIASHGN37ZWXU6R6UUU
echo $AWS_SECRET_ACCESS_KEY  # Should show: rn4s5bhsfhblegb3a5ooh69r4kp226chkr8uqcnrprq92qg3sov
echo $AWS_DEFAULT_REGION     # Should show: eu-west-2
```

#### 1.2 Cost Control Setup
```bash
# Set billing alerts (CRITICAL)
# This should be done in AWS Console before any deployment:
# 1. AWS Console → Billing → Budgets
# 2. Create budget with $10, $25, $50 alerts
# 3. Email notifications to your address
```

### **Phase 2: Deployment Process**

#### 2.1 Deploy 1-Hour Auto-Shutdown Cluster
```bash
# Navigate to MCP configuration directory
cd /workspaces/.devcontainer

# Option A: Full automated workflow (RECOMMENDED)
./mcp-config/complete-testing-workflow.sh

# Option B: Manual step-by-step
./mcp-config/deploy-1hour-neptune.sh
```

**⚠️ Cost Warning**: Charges begin immediately upon stack creation

#### 2.2 Deployment Timeline
```
Deployment Phase Timeline:
├── 0-2 minutes:    CloudFormation stack creation
├── 2-8 minutes:    Neptune cluster provisioning
├── 8-12 minutes:   Instance initialization
├── 12-15 minutes:  Ready for connections
└── 60 minutes:     AUTO-SHUTDOWN (CRITICAL)
```

#### 2.3 Monitoring Deployment
```bash
# Check CloudFormation stack status
STACK_NAME="tomriddelsdell-neptune-1h-$(date +%Y%m%d-%H%M)"
curl -s -X POST http://aws-mcp:8001/mcp/execute \
  -H "Content-Type: application/json" \
  -d "{\"action\": \"describe-stacks\", \"parameters\": {\"StackName\": \"$STACK_NAME\"}}"

# Monitor cluster status
./mcp-config/monitor-sessions.sh
```

### **Phase 3: Configuration**

#### 3.1 Configure Neptune MCP Server
```bash
# After cluster is AVAILABLE (8-15 minutes)
CLUSTER_NAME="tomriddelsdell-neptune-1h-$(date +%Y%m%d-%H%M)"
./mcp-config/configure-neptune-mcp.sh "$CLUSTER_NAME"
```

#### 3.2 Verify Configuration
```bash
# Check Neptune MCP server status
curl http://neptune-mcp:8002/health
# Should show real endpoint instead of "mock"

# Test basic connectivity
curl -X POST http://neptune-mcp:8002/gremlin \
  -H "Content-Type: application/json" \
  -d '{"query": "g.V().count()"}'
```

### **Phase 4: Testing Window**

#### 4.1 Available Testing Time
```
Testing Window (45-50 minutes available):
├── 15 minutes: Deployment + Configuration
├── 45 minutes: Active testing time
└── AUTO-SHUTDOWN: Exactly 60 minutes after start
```

#### 4.2 Example Test Operations
```bash
# Add test data
curl -X POST http://neptune-mcp:8002/gremlin \
  -H "Content-Type: application/json" \
  -d '{"query": "g.addV(\"person\").property(\"name\", \"test_user\")"}'

# Query data
curl -X POST http://neptune-mcp:8002/gremlin \
  -H "Content-Type: application/json" \
  -d '{"query": "g.V().hasLabel(\"person\").valueMap()"}'

# Count vertices
curl -X POST http://neptune-mcp:8002/gremlin \
  -H "Content-Type: application/json" \
  -d '{"query": "g.V().count()"}'
```

### **Phase 5: Auto-Shutdown**

#### 5.1 Automatic Shutdown Process
```
Auto-Shutdown Timeline (at 60 minutes):
├── Lambda function triggers
├── Deletes Neptune instances (2-5 minutes)
├── Deletes Neptune cluster (2-5 minutes)
├── Deletes CloudFormation stack
└── All charges stop
```

#### 5.2 Verification Steps
```bash
# Verify shutdown completed (after 65 minutes)
./mcp-config/monitor-sessions.sh

# Should show: "No active clusters found"

# Check AWS Console billing to confirm charges stopped
```

---

## 🚨 Emergency Procedures

### **Emergency Shutdown** (if auto-shutdown fails)
```bash
# IMMEDIATE shutdown of all Neptune resources
./mcp-config/emergency-shutdown.sh

# Verify in AWS Console:
# 1. EC2 → Instances (should be empty)
# 2. Neptune → Clusters (should be empty)  
# 3. CloudFormation → Stacks (should be deleted)
```

### **Cost Monitoring Commands**
```bash
# Check for any active Neptune resources
curl -s -X POST http://aws-mcp:8001/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{"action": "describe-db-clusters", "parameters": {}}'

# If any clusters found, emergency shutdown:
./mcp-config/emergency-shutdown.sh
```

---

## 📊 Cost Management Best Practices

### **Before Each Session**
1. **Set timer**: Physical timer for 55 minutes
2. **Check billing**: Review current AWS charges
3. **Verify auto-shutdown**: Test Lambda function exists
4. **Emergency plan**: Know how to manual shutdown

### **During Session**
1. **30-minute reminder**: Set halfway alert
2. **45-minute warning**: Prepare for shutdown
3. **Save work**: Export any important data
4. **Don't extend**: Resist temptation to continue

### **After Session**
1. **Verify shutdown**: Check AWS Console
2. **Monitor billing**: Ensure charges stopped
3. **Document costs**: Track actual vs. estimated
4. **Review session**: What was accomplished

---

## 📁 File Structure

```
.devcontainer/mcp-config/
├── deploy-1hour-neptune.sh           # Deploy cluster with auto-shutdown
├── configure-neptune-mcp.sh          # Configure MCP server to real cluster
├── complete-testing-workflow.sh      # Full automated workflow
├── monitor-sessions.sh               # Monitor active sessions and costs
├── emergency-shutdown.sh             # Emergency shutdown all resources
├── neptune-1hour-template-fixed.json # CloudFormation template
├── neptune-cost-analysis.md          # This file
└── neptune-runtime-config.json       # MCP server configuration
```

---

## ⚡ Quick Reference

### **Start Session**
```bash
cd /workspaces/.devcontainer
./mcp-config/complete-testing-workflow.sh
```

### **Emergency Stop**
```bash
./mcp-config/emergency-shutdown.sh
```

### **Check Status**
```bash
./mcp-config/monitor-sessions.sh
```

### **Cost Estimate**
- **Per session**: ~$0.074 (1 hour)
- **Per month (daily use)**: ~$2.22
- **Per month (weekly use)**: ~$0.30

---

## 🎯 Success Criteria

A successful Neptune testing session should:

✅ **Deploy in under 15 minutes**
✅ **Provide 45+ minutes of testing time**
✅ **Auto-shutdown after exactly 60 minutes**
✅ **Cost exactly ~$0.074**
✅ **Leave no residual AWS resources**
✅ **Enable real Gremlin/SPARQL queries**

---

## ❌ Failure Scenarios & Recovery

### **Scenario 1: Auto-shutdown fails**
```bash
# Symptoms: Cluster still running after 65 minutes
# Action: Immediate emergency shutdown
./mcp-config/emergency-shutdown.sh
```

### **Scenario 2: Deployment hangs**
```bash
# Symptoms: Cluster stuck in "creating" for >20 minutes
# Action: Cancel deployment
# Manual cleanup in AWS Console required
```

### **Scenario 3: MCP configuration fails**
```bash
# Symptoms: Neptune MCP still shows "mock" endpoint
# Action: Manual reconfiguration
./mcp-config/configure-neptune-mcp.sh <cluster-name>
```

### **Scenario 4: Unexpected costs**
```bash
# Symptoms: AWS bill higher than expected
# Action: 
# 1. Check for orphaned resources
# 2. Review AWS Cost Explorer
# 3. Verify all Neptune resources deleted
```

---

## 📞 Support & Escalation

### **If Issues Occur:**
1. **Immediate**: Run emergency shutdown
2. **Document**: Screenshot AWS Console
3. **Review**: Check this guide for solutions
4. **Monitor**: Watch billing for next 24 hours

### **Cost Control Contacts:**
- AWS Support (if charges seem incorrect)
- AWS Billing dashboard for real-time monitoring
- CloudWatch for resource monitoring

---

**Remember: Neptune testing is powerful but costly. Always prioritize cost control over convenience.**
