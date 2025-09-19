# Sequential Implementation Prompts

This directory contains a series of prompts designed for sequential execution to implement the Tom Riddell's Portfolio Platform according to Domain Driven Design and Event Sourcing principles.

## Execution Order

### Phase 0: Infrastructure Foundation (4 hours)
Execute these prompts in exact order - each depends on the previous:

1. **00-cli-authentication.md** - CLI tool setup and authentication (30 min)
2. **01-secrets-setup.md** - Environment configuration and secrets (45 min) 
3. **02-infrastructure-deployment.md** - Terraform deployment (90 min)
4. **03-cicd-pipeline.md** - GitHub Actions setup (45 min)
5. **04-observability-setup.md** - Monitoring and logging (30 min)
6. **05-mcp-validation.md** - AI tooling validation (30 min)

### Phase 1: Walking Skeleton (2 hours)
7. **10-project-structure.md** - Initial codebase and domain structure (120 min)

## Important Notes

### Container Environment
This workspace runs in a development container. Several tools require special container-compatible authentication:

- **Doppler**: Use service tokens instead of `doppler login`
- **GitHub**: May need personal access tokens
- **Wrangler**: May require API token environment variables
- **Browser-based OAuth**: Not available in containers

### Prerequisites
- Internet access for tool authentication
- Web browser access for creating service accounts
- GitHub account with appropriate permissions
- Willingness to create accounts on: Doppler, Neon, Cloudflare, Confluent

### Success Criteria
Each prompt includes specific success criteria and verification steps. Do not proceed to the next prompt until all criteria are met.

### Troubleshooting
Each prompt includes detailed troubleshooting sections for common container environment issues.

## Expected Outcomes

### After Phase 0
- Production-ready infrastructure deployed
- CI/CD pipeline operational
- Monitoring and observability active
- All CLI tools authenticated and functional

### After Phase 1
- Domain-driven project structure established
- Event sourcing foundation implemented
- Authentication system integrated
- Basic deployment pipeline validated

## Emergency Procedures
If any prompt fails catastrophically:
1. Document the error in `EXECUTION_SUMMARY.md`
2. Check the troubleshooting section of the failed prompt
3. Consider reverting infrastructure changes with `terraform destroy`
4. Seek human assistance for authentication issues

## Time Estimates
- **Total Phase 0**: ~4 hours (can be done in one session)
- **Total Phase 1**: ~2 hours 
- **Buffer Time**: Add 25% for troubleshooting and learning

**Realistic Timeline**: 8-10 hours total for complete foundation