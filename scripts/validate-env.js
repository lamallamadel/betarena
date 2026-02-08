#!/usr/bin/env node
/**
 * Environment Variables Validation Script
 * 
 * Validates that all required environment variables are set before deployment.
 * Run this script before building or deploying to catch missing variables early.
 * 
 * Usage:
 *   node scripts/validate-env.js [--frontend] [--functions]
 *   
 * Examples:
 *   node scripts/validate-env.js --frontend    # Validate frontend only
 *   node scripts/validate-env.js --functions   # Validate functions only
 *   node scripts/validate-env.js               # Validate both (default)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Required environment variables for each component
const REQUIRED_VARS = {
  frontend: [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID',
  ],
  functions: [
    'SPORTS_API_KEY',
  ],
};

/**
 * Load environment variables from a .env file
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const vars = {};

  content.split('\n').forEach((line) => {
    line = line.trim();
    
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) {
      return;
    }

    // Parse KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      
      // Remove quotes if present
      vars[key] = value.replace(/^["']|["']$/g, '');
    }
  });

  return vars;
}

/**
 * Validate environment variables for a component
 */
function validateComponent(component, envFilePath, requiredVars) {
  console.log(`\n${colors.cyan}Validating ${component} environment variables...${colors.reset}`);
  console.log(`${colors.blue}File: ${envFilePath}${colors.reset}`);

  // Check if .env file exists
  if (!fs.existsSync(envFilePath)) {
    console.error(`${colors.red}✗ Error: ${envFilePath} not found${colors.reset}`);
    console.log(`${colors.yellow}Run: cp ${envFilePath}.example ${envFilePath}${colors.reset}`);
    return false;
  }

  // Load environment variables
  const envVars = loadEnvFile(envFilePath);
  if (!envVars) {
    console.error(`${colors.red}✗ Error: Failed to load ${envFilePath}${colors.reset}`);
    return false;
  }

  // Validate each required variable
  const missing = [];
  const invalid = [];

  requiredVars.forEach((varName) => {
    const value = envVars[varName];

    if (!value) {
      missing.push(varName);
    } else if (value === 'your_api_key_here' || 
               value === 'your_project_id' || 
               value.includes('your_')) {
      invalid.push(varName);
    } else {
      console.log(`${colors.green}✓ ${varName}${colors.reset}`);
    }
  });

  // Report errors
  let hasErrors = false;

  if (missing.length > 0) {
    hasErrors = true;
    console.error(`\n${colors.red}✗ Missing variables:${colors.reset}`);
    missing.forEach(v => console.error(`  - ${v}`));
  }

  if (invalid.length > 0) {
    hasErrors = true;
    console.error(`\n${colors.yellow}⚠ Invalid placeholder values:${colors.reset}`);
    invalid.forEach(v => console.error(`  - ${v}`));
    console.log(`${colors.yellow}Please replace placeholder values with actual credentials.${colors.reset}`);
  }

  if (!hasErrors) {
    console.log(`\n${colors.green}✓ All ${component} environment variables are valid${colors.reset}`);
  }

  return !hasErrors;
}

/**
 * Main validation function
 */
function main() {
  const args = process.argv.slice(2);
  const validateFrontend = args.length === 0 || args.includes('--frontend');
  const validateFunctions = args.length === 0 || args.includes('--functions');

  console.log(`${colors.cyan}==============================================`);
  console.log(`  Environment Variables Validation`);
  console.log(`==============================================${colors.reset}`);

  let allValid = true;

  // Validate frontend
  if (validateFrontend) {
    const frontendValid = validateComponent(
      'Frontend',
      path.join(__dirname, '..', '.env'),
      REQUIRED_VARS.frontend
    );
    allValid = allValid && frontendValid;
  }

  // Validate functions
  if (validateFunctions) {
    const functionsValid = validateComponent(
      'Functions',
      path.join(__dirname, '..', 'functions', '.env'),
      REQUIRED_VARS.functions
    );
    allValid = allValid && functionsValid;
  }

  // Summary
  console.log(`\n${colors.cyan}==============================================${colors.reset}`);
  if (allValid) {
    console.log(`${colors.green}✓ All environment variables are valid!${colors.reset}`);
    console.log(`${colors.green}You can proceed with build/deployment.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Environment validation failed!${colors.reset}`);
    console.log(`${colors.yellow}Fix the errors above before building/deploying.${colors.reset}`);
    console.log(`${colors.blue}See ENV_SETUP.md for detailed setup instructions.${colors.reset}`);
    process.exit(1);
  }
}

// Run validation
main();
