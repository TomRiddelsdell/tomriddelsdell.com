# Neptune MCP Configuration Directory

## 🚨 IMPORTANT: READ COST_WARNING.md FIRST! 🚨

This directory contains scripts and templates for deploying Amazon Neptune clusters with automatic cost control.

## ⚠️ Critical Files (READ BEFORE USE)

### **🚨 Cost & Safety Documentation**
- **`../../docs/NEPTUNE_COST_WARNING.md`** - ⚠️ **READ THIS FIRST** - Cost warnings and safety checklist
- **`../../docs/NEPTUNE_DEPLOYMENT_GUIDE.md`** - Complete deployment flow with cost controls
- **`../../docs/NEPTUNE_COST_ANALYSIS.md`** - Detailed cost analysis and alternatives

### **🔧 Deployment Scripts**
- **`complete-testing-workflow.sh`** - 🟢 **RECOMMENDED** - Full automated workflow
- **`deploy-1hour-neptune.sh`** - Deploy cluster only
- **`configure-neptune-mcp.sh`** - Configure MCP server for real cluster
- **`emergency-shutdown.sh`** - 🚨 Emergency shutdown all Neptune resources

### **📊 Monitoring & Management**
- **`monitor-sessions.sh`** - Check active sessions and costs
- **`neptune-1hour-template-fixed.json`** - CloudFormation template with auto-shutdown

## 🚀 Quick Start (First Time Users)

```bash
# 1. READ the cost warnings first
cat ../../docs/NEPTUNE_COST_WARNING.md

# 2. Set up AWS billing alerts in AWS Console
#    Create budgets with $10, $25, $50 thresholds

# 3. Run the complete workflow
./complete-testing-workflow.sh
```

## 💰 Cost Summary

- **Per Session**: ~$0.074 (1 hour)
- **If Forgotten**: $1.78/day, $54/month
- **Auto-shutdown**: Required to prevent runaway costs

## 🛡️ Safety Features

✅ **1-hour auto-shutdown** - Lambda function deletes cluster automatically
✅ **Cost warnings** - Multiple prompts before deployment  
✅ **Emergency shutdown** - Manual override if auto-shutdown fails
✅ **Monitoring scripts** - Track active resources and costs

## 📞 If Something Goes Wrong

```bash
# Emergency shutdown everything
./emergency-shutdown.sh

# Then verify in AWS Console that all Neptune resources are deleted
```

## 🔗 Integration with MCP Servers

- **AWS MCP Server**: `http://aws-mcp:8001` - Deploys Neptune infrastructure
- **Neptune MCP Server**: `http://neptune-mcp:8002` - Connects to deployed clusters

## 📋 File Dependencies

```
complete-testing-workflow.sh
├── calls: deploy-1hour-neptune.sh
├── calls: configure-neptune-mcp.sh  
├── uses: neptune-1hour-template-fixed.json
└── monitors: AWS MCP Server at aws-mcp:8001

emergency-shutdown.sh
└── uses: AWS MCP Server at aws-mcp:8001

monitor-sessions.sh
└── uses: AWS MCP Server at aws-mcp:8001
```

---

**Remember: Neptune is powerful but costly. Always prioritize cost control over convenience.**
