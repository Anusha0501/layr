import * as vscode from 'vscode';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { planner } from './planner';

// Load environment variables from .env file
const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
if (workspaceRoot) {
  const envPath = path.join(workspaceRoot, '.env');
  console.log('Layr: Attempting to load .env from:', envPath);
  
  try {
    // Try dotenv first
    dotenv.config({ path: envPath });
    console.log('Layr: dotenv.config() completed');
    
    // Manual fallback - read file directly
    if (!process.env.GEMINI_API_KEY && fs.existsSync(envPath)) {
      console.log('Layr: dotenv failed, trying manual file read');
      const envContent = fs.readFileSync(envPath, 'utf8');
      console.log('Layr: .env file content length:', envContent.length);
      
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('GEMINI_API_KEY=')) {
          const apiKey = trimmed.split('=')[1];
          process.env.GEMINI_API_KEY = apiKey;
          console.log('Layr: Manually set GEMINI_API_KEY from file');
          break;
        }
      }
    }
  } catch (error) {
    console.log('Layr: Error loading .env:', error);
  }
  
  console.log('Layr: GEMINI_API_KEY after load:', process.env.GEMINI_API_KEY ? '***configured***' : 'not found');
} else {
  console.log('Layr: No workspace folder found, trying default .env location');
  dotenv.config();
}

/**
 * This method is called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Layr Extension: ONLINE ONLY MODE ACTIVATED - Build ' + new Date().toISOString());
  console.log('Layr extension is now active! 🚀');

  // Register debug command to test API key loading
  const debugCommand = vscode.commands.registerCommand('layr.debug', async () => {
    const config = vscode.workspace.getConfiguration('layr');
    const settingsApiKey = config.get<string>('geminiApiKey') || '';
    const envApiKey = process.env.GEMINI_API_KEY || '';
    
    // Test AI generator availability
    let aiGeneratorStatus = 'unknown';
    let apiTestResult = 'not tested';
    try {
      const isAvailable = await planner.isAIAvailable();
      aiGeneratorStatus = isAvailable ? 'available' : 'not available';
      
      // Test the API key directly if available
      if (isAvailable) {
        const testResult = await planner.testAPIKey();
        apiTestResult = testResult.success ? 'API key works!' : `API error: ${testResult.error}`;
      }
    } catch (error) {
      aiGeneratorStatus = `error: ${error}`;
    }
    
    const message = `Debug Info:
Settings API Key: ${settingsApiKey ? '***configured***' : 'not set'}
Environment API Key: ${envApiKey ? '***configured***' : 'not set'}
Final API Key: ${settingsApiKey || envApiKey ? '***configured***' : 'not set'}
AI Generator Status: ${aiGeneratorStatus}
API Test Result: ${apiTestResult}`;
    
    vscode.window.showInformationMessage(message);
    console.log('Layr Debug:', { 
      settingsApiKey: settingsApiKey ? '***configured***' : 'not set',
      envApiKey: envApiKey ? '***configured***' : 'not set',
      aiGeneratorStatus,
      apiTestResult
    });
  });

  // Register the "Create Plan" command
  const createPlanCommand = vscode.commands.registerCommand('layr.createPlan', async () => {
    try {
      // Show input box to get user's prompt
      const prompt = await vscode.window.showInputBox({
        prompt: 'What do you want to build?',
        placeHolder: 'e.g., A React todo app with authentication and database',
        ignoreFocusOut: true,
        validateInput: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'Please enter a description of what you want to build';
          }
          if (value.trim().length < 10) {
            return 'Please provide a more detailed description (at least 10 characters)';
          }
          return null;
        }
      });

      if (!prompt) {
        return; // User cancelled
      }

      // Show progress indicator
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating project plan...',
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 0, message: 'Analyzing your request...' });
        
        try {
          // Generate the plan
          const plan = await planner.generatePlan(prompt.trim());
          
          progress.report({ increment: 50, message: 'Converting to Markdown...' });
          
          // Convert plan to Markdown
          const markdown = planner.planToMarkdown(plan);
          
          progress.report({ increment: 80, message: 'Opening plan in editor...' });
          
          // Create a new document with the plan
          const doc = await vscode.workspace.openTextDocument({
            content: markdown,
            language: 'markdown'
          });
          
          // Show the document in a new editor
          await vscode.window.showTextDocument(doc, {
            preview: false,
            viewColumn: vscode.ViewColumn.One
          });
          
          progress.report({ increment: 100, message: 'Plan generated successfully!' });
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          vscode.window.showErrorMessage(`Failed to generate plan: ${errorMessage}`);
          console.error('Plan generation error:', error);
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Error: ${errorMessage}`);
      console.error('Create plan command error:', error);
    }
  });

  // Register the "Execute Plan" command
  const executePlanCommand = vscode.commands.registerCommand('layr.executePlan', async () => {
    try {
      // For now, just show a notification
      // This can be extended later to scaffold code or run scripts
      const action = await vscode.window.showInformationMessage(
        'Executing plan... 🚀',
        { modal: false },
        'View Progress',
        'Cancel'
      );

      if (action === 'View Progress') {
        vscode.window.showInformationMessage(
          'Plan execution feature is coming soon! For now, follow the steps in your generated plan manually.',
          { modal: false }
        );
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Error executing plan: ${errorMessage}`);
      console.error('Execute plan command error:', error);
    }
  });

  // Register configuration change listener to refresh planner config
  const configChangeListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('layr.geminiApiKey')) {
      planner.refreshConfig();
      vscode.window.showInformationMessage('Layr configuration updated! 🔄');
    }
  });

  // Add commands to subscriptions for proper cleanup
  context.subscriptions.push(
    debugCommand,
    createPlanCommand,
    executePlanCommand,
    configChangeListener
  );

  // Show welcome message on first activation
  const hasShownWelcome = context.globalState.get('layr.hasShownWelcome', false);
  if (!hasShownWelcome) {
    showWelcomeMessage(context);
  }
}

/**
 * Show welcome message with setup instructions
 */
async function showWelcomeMessage(context: vscode.ExtensionContext) {
  const action = await vscode.window.showInformationMessage(
    'Welcome to Layr! 🎯 To get started with AI-powered planning, configure your Gemini API key.',
    'Configure API Key',
    'Use Offline Mode',
    'Learn More'
  );

  switch (action) {
    case 'Configure API Key':
      await vscode.commands.executeCommand('workbench.action.openSettings', 'layr.geminiApiKey');
      break;
    case 'Use Offline Mode':
      vscode.window.showInformationMessage(
        'You can use Layr without an API key! It will generate plans using built-in templates. Try the "Layr: Create Plan" command.'
      );
      break;
    case 'Learn More':
      vscode.env.openExternal(vscode.Uri.parse('https://makersuite.google.com/app/apikey'));
      break;
  }

  // Mark welcome as shown
  context.globalState.update('layr.hasShownWelcome', true);
}

/**
 * This method is called when the extension is deactivated
 */
export function deactivate() {
  console.log('Layr extension deactivated');
}