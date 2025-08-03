#!/usr/bin/env node

/**
 * Test script to list Neon projects using the Neon API directly
 */

async function main() {
  console.log('🌊 Testing Neon API Connection...\n');
  
  try {
    const apiKey = process.env.NEON_API_KEY;
    
    if (!apiKey) {
      console.error('❌ NEON_API_KEY environment variable not found');
      process.exit(1);
    }
    
    console.log('✅ Neon API Key found');
    
    // Test direct API call to list projects
    const response = await fetch('https://console.neon.tech/api/v2/projects', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('🎯 Your Neon Projects:');
    console.log('=' .repeat(50));
    
    if (data.projects && data.projects.length > 0) {
      data.projects.forEach((project, index) => {
        console.log(`\n${index + 1}. ${project.name}`);
        console.log(`   ID: ${project.id}`);
        console.log(`   Region: ${project.region_id}`);
        console.log(`   Created: ${new Date(project.created_at).toLocaleDateString()}`);
        console.log(`   Status: ${project.state || 'Unknown'}`);
      });
    } else {
      console.log('\n📝 No projects found');
    }
    
    console.log('\n✨ Successfully listed your Neon projects!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
