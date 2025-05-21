import { db } from './db';
import { templates, InsertTemplate } from '@shared/schema';

export async function initializeTemplates() {
  // First check if templates already exist
  const existingTemplates = await db.select().from(templates);
  
  if (existingTemplates.length > 0) {
    console.log(`Templates already initialized (${existingTemplates.length} templates found)`);
    return;
  }
  
  console.log('Initializing template examples...');
  
  const templateExamples: InsertTemplate[] = [
    {
      name: 'Financial Report Automation',
      description: 'Generate & distribute financial reports automatically on schedule',
      iconType: 'chart',
      iconColor: 'indigo',
      config: {
        schedule: 'weekly',
        outputFormats: ['pdf', 'excel', 'html'],
        notificationChannels: ['email', 'slack']
      }
    },
    {
      name: 'Risk Assessment Dashboard',
      description: 'Visualize real-time risk metrics for portfolio management',
      iconType: 'shield',
      iconColor: 'red',
      config: {
        updateFrequency: 'realtime',
        riskMetrics: ['var', 'volatility', 'beta', 'correlations'],
        automatedAlerts: true
      }
    },
    {
      name: 'Market Data Aggregator',
      description: 'Collect and process market data from multiple sources',
      iconType: 'database',
      iconColor: 'blue',
      config: {
        dataSources: ['bloomberg', 'reuters', 'alpha-vantage'],
        storageType: 'timeseries',
        cleansingRules: true
      }
    },
    {
      name: 'Automated Trading Strategy',
      description: 'Framework for backtesting and implementing trading algorithms',
      iconType: 'activity',
      iconColor: 'green',
      config: {
        assetClasses: ['equities', 'futures', 'forex'],
        backTestingEngine: 'integrated',
        riskControls: ['stop-loss', 'position-limits']
      }
    },
    {
      name: 'Compliance Reporting',
      description: 'Automate regulatory compliance documentation and submissions',
      iconType: 'file-text',
      iconColor: 'amber',
      config: {
        regulations: ['mifid', 'dodd-frank', 'basel'],
        filingSchedule: 'quarterly',
        auditTrail: true
      }
    },
    {
      name: 'Investment Research Pipeline',
      description: 'Collect, analyze and report on investment opportunities',
      iconType: 'search',
      iconColor: 'purple',
      config: {
        researchTypes: ['fundamental', 'technical', 'quantitative'],
        outputFormats: ['report', 'dashboard'],
        aiAssisted: true
      }
    }
  ];

  // Insert each template and set a random number of users (for demo purposes)
  for (const template of templateExamples) {
    const [insertedTemplate] = await db.insert(templates).values({
      ...template,
      usersCount: Math.floor(Math.random() * 2000) + 500 // Random between 500-2500
    }).returning();
    
    console.log(`Created template: ${insertedTemplate.name}`);
  }
  
  console.log('Templates initialization complete');
}