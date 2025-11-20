import * as vscode from 'vscode';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { planner } from './planner';

/**
 * This method is called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 LAYR EXTENSION ACTIVATE FUNCTION CALLED! 🚀');
  console.log('Layr Extension: ONLINE ONLY MODE ACTIVATED - Build ' + new Date().toISOString());
  console.log('Layr extension is now active! 🚀');

  // Load environment variables from .env file in extension directory
  const extensionRoot = context.extensionPath;
  const envPath = path.join(extensionRoot, '.env');
  console.log('Layr: Extension root:', extensionRoot);
  console.log('Layr: Attempting to load .env from:', envPath);
  console.log('Layr: .env file exists:', fs.existsSync(envPath));
  
  if (fs.existsSync(envPath)) {
    try {
      // Load .env from extension directory
      const result = dotenv.config({ path: envPath });
      console.log('Layr: dotenv.config() result:', result.error ? 'ERROR: ' + result.error : 'SUCCESS');
      console.log('Layr: GROQ_API_KEY after dotenv:', process.env.GROQ_API_KEY ? '***configured***' : 'not found');
      
      // Manual fallback - read file directly
      if (!process.env.GROQ_API_KEY) {
        console.log('Layr: dotenv failed, trying manual file read');
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log('Layr: .env file content length:', envContent.length);
        
        const lines = envContent.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('GROQ_API_KEY=')) {
            const apiKey = trimmed.substring('GROQ_API_KEY='.length).trim();
            process.env.GROQ_API_KEY = apiKey;
            console.log('Layr: Manually set GROQ_API_KEY from file, length:', apiKey?.length);
            break;
          }
        }
      }
    } catch (error) {
      console.log('Layr: Error loading .env:', error);
    }
    
    console.log('Layr: Final GROQ_API_KEY status:', process.env.GROQ_API_KEY ? '***configured*** (length: ' + process.env.GROQ_API_KEY.length + ')' : 'not found');
  } else {
    console.log('Layr: No .env file found in extension directory');
  }

  // Refresh planner configuration after .env is loaded
  console.log('Layr: Refreshing planner configuration after .env load');
  planner.refreshConfig();

  // Register debug command to test Groq integration
  const debugCommand = vscode.commands.registerCommand('layr.debug', async () => {
    // Test AI provider availability
    let aiProviderStatus = 'unknown';
    let apiTestResult = 'not tested';
    try {
      const isAvailable = await planner.isAIAvailable();
      aiProviderStatus = isAvailable ? '✅ Ready' : '❌ Not Available';
      
      // Test the API key directly if available
      if (isAvailable) {
        const testResult = await planner.testAPIKey();
        apiTestResult = testResult.success ? '✅ Working perfectly!' : `❌ Error: ${testResult.error}`;
      }
    } catch (error) {
      aiProviderStatus = `❌ Error: ${error}`;
    }
    
    const message = `Layr Status (Pre-configured with Groq)

🤖 AI Provider: Groq (Llama 3.3 70B)
⚡ Status: ${aiProviderStatus}
🔑 API Test: ${apiTestResult}

No configuration needed - ready to use!
Just run "Layr: Create Plan" to get started.`;
    
    vscode.window.showInformationMessage(message);
    console.log('Layr Status:', { 
      provider: 'Groq',
      model: 'llama-3.3-70b-versatile',
      aiProviderStatus,
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

  // Listen for configuration changes
  const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('layr.aiModel') ||
        event.affectsConfiguration('layr.apiKey') ||
        event.affectsConfiguration('layr.openaiOrganization')) {
      vscode.window.showInformationMessage('Layr: Configuration updated! Changes will take effect on next plan generation.');
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
    'Welcome to Layr! To get started with AI-powered planning, configure your AI provider and API key.',
    'Configure Settings',
    'Use Offline Mode',
    'Learn More'
  );

  switch (action) {
    case 'Configure Settings':
      await vscode.commands.executeCommand('workbench.action.openSettings', 'layr.aiProvider');
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