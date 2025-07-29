import { db } from "./config/db";
import { templates } from "../../domains/shared-kernel/src/schema";
import { eq } from "drizzle-orm";

/**
 * Initialize default automation templates
 */
export async function initializeTemplates() {
  try {
    console.log('Checking if templates need initialization...');
    
    // Check if templates already exist
    const existingTemplates = await db.select().from(templates);
    
    if (existingTemplates.length > 0) {
      console.log(`Templates already initialized (${existingTemplates.length} templates found)`);
      return;
    }

    console.log('Initializing default templates...');

    const defaultTemplates = [
      {
        name: 'Social Media Automation',
        description: 'Automatically post content across multiple social platforms',
        iconType: 'share',
        iconColor: 'indigo',
        usersCount: 1250,
        config: {
          platforms: ['twitter', 'facebook', 'linkedin'],
          schedule: 'daily',
          contentTypes: ['text', 'image']
        }
      },
      {
        name: 'Email Newsletter',
        description: 'Send automated newsletters to your subscribers',
        iconType: 'mail',
        iconColor: 'green',
        usersCount: 980,
        config: {
          frequency: 'weekly',
          template: 'modern',
          segments: ['all', 'vip', 'recent']
        }
      },
      {
        name: 'Meeting Scheduler',
        description: 'Automatically schedule and send meeting invites',
        iconType: 'calendar',
        iconColor: 'purple',
        usersCount: 750,
        config: {
          duration: 30,
          buffer: 15,
          platforms: ['zoom', 'teams', 'meet']
        }
      },
      {
        name: 'Video Processing',
        description: 'Process and optimize videos automatically',
        iconType: 'video',
        iconColor: 'rose',
        usersCount: 620,
        config: {
          formats: ['mp4', 'webm'],
          quality: 'HD',
          compression: 'medium'
        }
      },
      {
        name: 'Customer Support Bot',
        description: 'Automated responses for common customer queries',
        iconType: 'message-square',
        iconColor: 'amber',
        usersCount: 890,
        config: {
          channels: ['email', 'chat', 'twitter'],
          responseTime: 'instant',
          escalation: 'complex_queries'
        }
      },
      {
        name: 'Workflow Trigger',
        description: 'Start workflows based on specific events',
        iconType: 'play',
        iconColor: 'sky',
        usersCount: 1100,
        config: {
          triggers: ['webhook', 'schedule', 'email'],
          conditions: 'customizable',
          actions: 'multiple'
        }
      }
    ];

    // Insert templates
    await db.insert(templates).values(defaultTemplates.map(template => ({
      name: template.name,
      description: template.description,
      iconType: template.iconType,
      iconColor: template.iconColor as any,
      usersCount: template.usersCount,
      config: template.config
    })));

    console.log(`Successfully initialized ${defaultTemplates.length} templates`);
  } catch (error) {
    console.error('Error initializing templates:', error);
    throw error;
  }
}