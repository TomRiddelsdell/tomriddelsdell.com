#!/usr/bin/env tsx

import { GitHubMCPClient } from '../infrastructure/mcp/github-mcp-client.js';

async function checkDeploymentLogs() {
  const client = new GitHubMCPClient();
  
  try {
    console.log('🔍 Connecting to GitHub MCP server...');
    await client.connect();
    
    const owner = 'TomRiddelsdell';
    const repo = 'tomriddelsdell.com';
    
    console.log('📋 Fetching recent workflow runs...');
    const runs = await client.getWorkflowRuns(owner, repo, 10);
    
    if (runs.length === 0) {
      console.log('❌ No workflow runs found');
      return;
    }
    
    console.log('\n🚀 Recent Workflow Runs:');
    console.log('========================');
    
    runs.forEach((run, index) => {
      const status = run.conclusion === 'success' ? '✅' : 
                    run.conclusion === 'failure' ? '❌' : 
                    run.status === 'in_progress' ? '🔄' : '⏸️';
      
      console.log(`${index + 1}. ${status} ${run.name}`);
      console.log(`   Branch: ${run.head_branch}`);
      console.log(`   Status: ${run.status} (${run.conclusion || 'pending'})`);
      console.log(`   Created: ${new Date(run.created_at).toLocaleString()}`);
      console.log(`   URL: ${run.html_url}`);
      console.log('');
    });
    
    // Find the latest failed run
    const latestFailedRun = await client.getLatestFailedRun(owner, repo);
    
    if (latestFailedRun) {
      console.log('🔍 Latest Failed Run Details:');
      console.log('=============================');
      console.log(`Run ID: ${latestFailedRun.id}`);
      console.log(`Branch: ${latestFailedRun.head_branch}`);
      console.log(`SHA: ${latestFailedRun.head_sha}`);
      console.log(`Created: ${new Date(latestFailedRun.created_at).toLocaleString()}`);
      
      console.log('\n📋 Fetching job details...');
      const jobs = await client.getWorkflowJobs(owner, repo, latestFailedRun.id);
      
      jobs.forEach(job => {
        const jobStatus = job.conclusion === 'success' ? '✅' : 
                         job.conclusion === 'failure' ? '❌' : 
                         job.status === 'in_progress' ? '🔄' : '⏸️';
        
        console.log(`\n${jobStatus} Job: ${job.name}`);
        console.log(`   Status: ${job.status} (${job.conclusion || 'pending'})`);
        
        if (job.steps && job.steps.length > 0) {
          console.log('   Steps:');
          job.steps.forEach(step => {
            const stepStatus = step.conclusion === 'success' ? '✅' : 
                              step.conclusion === 'failure' ? '❌' : 
                              step.status === 'in_progress' ? '🔄' : '⏸️';
            console.log(`     ${stepStatus} ${step.name}`);
          });
        }
      });
      
      console.log('\n📄 Fetching workflow logs...');
      const logs = await client.getWorkflowLogs(owner, repo, latestFailedRun.id);
      
      if (logs && logs !== 'No logs available') {
        console.log('\n📋 Recent Log Entries (last 50 lines):');
        console.log('=====================================');
        const logLines = logs.split('\n');
        const recentLines = logLines.slice(-50);
        recentLines.forEach(line => {
          if (line.includes('ERROR') || line.includes('FAILED') || line.includes('❌')) {
            console.log(`🔴 ${line}`);
          } else if (line.includes('WARNING') || line.includes('⚠️')) {
            console.log(`🟡 ${line}`);
          } else {
            console.log(`   ${line}`);
          }
        });
      }
    } else {
      console.log('✅ No failed runs found in recent history');
    }
    
  } catch (error) {
    console.error('❌ Error checking deployment logs:', error);
  } finally {
    await client.disconnect();
  }
}

// Run the script
checkDeploymentLogs().catch(console.error);