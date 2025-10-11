import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProjectPlan, PlanGenerator, AIServiceError, APIKeyMissingError, FileStructureItem, PlanStep } from './interfaces';

/**
 * Gemini AI-powered plan generator
 */
export class GeminiPlanGenerator implements PlanGenerator {
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log('GeminiPlanGenerator: API key received:', apiKey ? '***configured***' : 'empty');
    console.log('GeminiPlanGenerator: API key length:', apiKey?.length || 0);
    
    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log('GeminiPlanGenerator: GoogleGenerativeAI initialized successfully');
    } else {
      console.log('GeminiPlanGenerator: API key invalid or placeholder, not initializing AI');
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.genAI !== null && this.apiKey.trim() !== '';
  }

  async testApiKey(): Promise<{ success: boolean; error?: string }> {
    if (!this.genAI) {
      return { success: false, error: 'AI not initialized' };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Hello");
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async generatePlan(prompt: string): Promise<ProjectPlan> {
    if (!this.genAI) {
      throw new APIKeyMissingError();
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const systemPrompt = `You are an expert software architect and project planner. Create a detailed, actionable project plan in JSON format for the following request: "${prompt}"

Please respond with a valid JSON object that matches this exact structure:
{
  "title": "Project Title",
  "overview": "Brief description of what will be built",
  "requirements": ["requirement 1", "requirement 2", "requirement 3"],
  "fileStructure": [
    {
      "name": "src",
      "type": "directory",
      "path": "src/",
      "description": "Source code directory",
      "children": [
        {
          "name": "index.ts",
          "type": "file",
          "path": "src/index.ts",
          "description": "Main entry point"
        }
      ]
    }
  ],
  "nextSteps": [
    {
      "id": "step1",
      "description": "Set up project structure",
      "completed": false,
      "priority": "high",
      "estimatedTime": "30 minutes",
      "dependencies": []
    }
  ]
}

Make the plan comprehensive but practical. Include 5-10 requirements, a logical file structure with 8-15 files/directories, and 6-12 actionable next steps. Focus on modern best practices and include testing, documentation, and deployment considerations.`;

      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response (handle cases where AI adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new AIServiceError('Invalid response format from AI service');
      }

      const planData = JSON.parse(jsonMatch[0]);
      
      // Validate and transform the response
      const plan: ProjectPlan = {
        title: planData.title || 'Generated Project Plan',
        overview: planData.overview || 'No overview provided',
        requirements: Array.isArray(planData.requirements) ? planData.requirements : [],
        fileStructure: this.validateFileStructure(planData.fileStructure || []),
        nextSteps: this.validateNextSteps(planData.nextSteps || []),
        generatedAt: new Date(),
        generatedBy: 'ai'
      };

      return plan;
    } catch (error) {
      if (error instanceof APIKeyMissingError) {
        throw error;
      }
      
      if (error instanceof SyntaxError) {
        throw new AIServiceError('Failed to parse AI response as JSON', error);
      }
      
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        error instanceof Error ? error : undefined
      );
    }
  }

  private validateFileStructure(items: any[]): FileStructureItem[] {
    return items.map((item, index) => ({
      name: item.name || `item-${index}`,
      type: item.type === 'directory' ? 'directory' : 'file',
      path: item.path || item.name || `item-${index}`,
      description: item.description,
      children: item.children ? this.validateFileStructure(item.children) : undefined
    }));
  }

  private validateNextSteps(steps: any[]): PlanStep[] {
    return steps.map((step, index) => ({
      id: step.id || `step-${index + 1}`,
      description: step.description || `Step ${index + 1}`,
      completed: Boolean(step.completed),
      priority: ['high', 'medium', 'low'].includes(step.priority) ? step.priority : 'medium',
      estimatedTime: step.estimatedTime,
      dependencies: Array.isArray(step.dependencies) ? step.dependencies : []
    }));
  }
}