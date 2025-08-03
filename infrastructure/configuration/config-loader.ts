import { z } from "zod";
import { config as loadDotenv } from "dotenv";
import { baseConfigSchema, BaseConfig } from "./base-config";
import { ConfigTransformer } from "./config-transformer";

/**
 * Generic configuration loader with hierarchical environment files
 * This module is unaware of specific configuration fields - all field knowledge
 * is externalized to config-schema.ts and processed by ConfigTransformer
 */

export class ConfigurationError extends Error {
  constructor(
    message: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/**
 * Load environment files in hierarchical order
 * Handles the environment file loading strategy but doesn't know about specific config fields
 */
function loadEnvironmentFiles(): void {
  const environment = process.env.NODE_ENV || "development";
  
  // Custom dotenv loading helper
  const loadDotenvSafe = (path: string) => {
    try {
      const result = loadDotenv({ path, override: false });
      return result;
    } catch (error) {
      // Silently continue if files don't exist
      return { parsed: {} };
    }
  };
  
  // For tests, load files in proper precedence order
  if (process.env.VITEST) {
    // Store the current state of process.env before loading any files
    const initialEnv = { ...process.env };
    
    // 1. Load template file first for base defaults
    const templateResult = loadDotenvSafe('.env.template');
    if (templateResult.parsed) {
      Object.keys(templateResult.parsed).forEach(key => {
        // Only use template defaults if the variable was not set at all
        // Don't override empty strings set by tests (they're intentional)
        if (!initialEnv.hasOwnProperty(key)) {
          process.env[key] = templateResult.parsed![key];
        }
      });
    }
    
    // 2. If NODE_ENV is set to a specific environment, load that environment file
    if (environment !== 'test') {
      const envResult = loadDotenvSafe(`.env.${environment}`);
      if (envResult.parsed) {
        Object.keys(envResult.parsed).forEach(key => {
          // Only override if the variable wasn't explicitly set before loading files
          if (!initialEnv.hasOwnProperty(key)) {
            process.env[key] = envResult.parsed![key];
          }
        });
      }
    }
    return;
  }
  
  // For non-test environments, load in normal hierarchical order
  loadDotenvSafe('.env.template');
  loadDotenvSafe('.env');
  loadDotenvSafe(`.env.${environment}`);
}

/**
 * Load and validate configuration using schema-driven transformation
 */
export function loadConfiguration(): BaseConfig {
  try {
    // Load environment files hierarchically
    loadEnvironmentFiles();
    
    // Transform environment variables to config structure using schema
    const configData = ConfigTransformer.transform(process.env);
    
    // Validate against schema
    const result = baseConfigSchema.parse(configData);
    
    console.log(`Configuration loaded for environment: ${result.environment}`);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      throw new ConfigurationError(
        `Configuration validation failed: ${errorMessage}`,
        error,
      );
    }
    throw new ConfigurationError('Failed to load configuration', error as Error);
  }
}

// Global configuration instance
let configInstance: BaseConfig | null = null;

/**
 * Get the current configuration instance
 * Loads configuration on first access
 */
export function getConfig(): BaseConfig {
  if (!configInstance) {
    configInstance = loadConfiguration();
  }
  return configInstance;
}

/**
 * Reload configuration (useful for testing)
 */
export function reloadConfig(): BaseConfig {
  configInstance = null;
  return getConfig();
}

/**
 * Reload configuration (alias for compatibility)
 */
export function reloadConfiguration(): BaseConfig {
  configInstance = null;
  return loadConfiguration();
}

/**
 * Get configuration for a specific environment (testing utility)
 */
export function getConfigForEnvironment(environment: string): BaseConfig {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = environment;
  
  try {
    return loadConfiguration();
  } finally {
    if (originalEnv) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  }
}

/**
 * Validate required environment variables are present
 * Uses schema-driven validation instead of hardcoded list
 */
export function validateRequiredEnvironment(): void {
  // Load environment files first
  loadEnvironmentFiles();
  
  // Transform to get config structure
  const configData = ConfigTransformer.transform(process.env);
  
  // Check for missing required fields
  const missing = ConfigTransformer.validateRequired(configData);

  if (missing.length > 0) {
    throw new ConfigurationError(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

/**
 * Get current environment type
 */
export function getEnvironment(): string {
  return process.env.NODE_ENV || "development";
}
