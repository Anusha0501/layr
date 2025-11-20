import { AIProvider, AIProviderType, AIServiceError } from '../interfaces';
import fetch from 'node-fetch';

/**
 * Groq AI Provider
 * Provides fast inference for various LLM models
 * This provider comes with a pre-configured API key for immediate use
 */
export class GroqProvider implements AIProvider {
  readonly name = 'Groq';
  readonly type: AIProviderType = 'groq';
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(config: { apiKey?: string; model?: string; baseURL?: string }) {
    // Use provided API key or fallback to embedded key
    this.apiKey = config.apiKey || this.getEmbeddedApiKey();
    this.model = config.model || 'llama-3.3-70b-versatile';
    this.baseURL = config.baseURL || 'https://api.groq.com/openai/v1';
  }

  /**
   * Embedded API key for immediate use
   * This allows users to use the extension without any configuration
   */
  private getEmbeddedApiKey(): string {
    // IMPORTANT: Add your Groq API key here before distributing
    // Get your free API key from: https://console.groq.com/keys
    // For development, you can also set GROQ_API_KEY in .env file
    
    const embeddedKey = 'YOUR_GROQ_API_KEY_HERE'; // <-- Replace this with your actual Groq API key
    
    return process.env.GROQ_API_KEY || embeddedKey;
  }

  async generatePlan(prompt: string, options?: any): Promise<string> {
    if (!this.apiKey || this.apiKey === 'YOUR_GROQ_API_KEY_HERE') {
      throw new AIServiceError(
        'Layr extension needs to be configured by the developer. ' +
        'The Groq API key is not set up yet. ' +
        'Please contact the extension author or check the extension documentation.'
      );
    }

    try {
      const systemPrompt = `You are an expert software architect and project planner for Layr AI. Generate a comprehensive, highly detailed, and professional project plan based on the user's request.

Your response MUST follow this EXACT structure and be EXTREMELY DETAILED:

# Project Title
[Clear, compelling, professional title]

## Overview
Write 3-4 detailed paragraphs covering:
- The purpose and value proposition of the project
- Target users and use cases
- Key features and functionality
- Expected benefits and outcomes
- Technical approach and architecture philosophy

## Requirements

### Functional Requirements
- [Detailed functional requirement 1 with explanation]
- [Detailed functional requirement 2 with explanation]
- [Detailed functional requirement 3 with explanation]
- [List 8-12 comprehensive functional requirements]

### Technical Requirements
- [Detailed technical requirement 1 with rationale]
- [Detailed technical requirement 2 with rationale]
- [Detailed technical requirement 3 with rationale]
- [List 6-10 comprehensive technical requirements]

### Non-Functional Requirements
- Performance: [Specific performance targets]
- Security: [Security considerations and measures]
- Scalability: [Scalability requirements]
- Accessibility: [Accessibility standards]
- [List 4-6 non-functional requirements]

## Technology Stack

### Frontend
- [Primary framework/library with version and rationale]
- [State management solution with explanation]
- [UI component library with justification]
- [Additional frontend tools]

### Backend (if applicable)
- [Server framework with version]
- [Database with rationale]
- [Authentication approach]
- [API design pattern]

### DevOps & Tools
- [Version control strategy]
- [CI/CD pipeline tools]
- [Testing frameworks]
- [Code quality tools]
- [Deployment platform]

## Architecture

### System Architecture
[Detailed description of the overall system architecture, including:
- High-level component breakdown
- Data flow description
- Integration points
- Architecture patterns used (MVC, microservices, etc.)]

### Key Components
1. **[Component Name]**: [Detailed description of purpose, responsibilities, and interactions]
2. **[Component Name]**: [Detailed description of purpose, responsibilities, and interactions]
3. **[Component Name]**: [Detailed description of purpose, responsibilities, and interactions]
[List 5-8 key components with detailed explanations]

## File Structure
\`\`\`
project-root/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Common/shared components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   ├── features/        # Feature-specific components
│   │   │   └── [feature-components]
│   │   └── layout/          # Layout components
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Sidebar.tsx
│   ├── pages/               # Page components/routes
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   └── [other-pages]
│   ├── services/            # API services and business logic
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── [other-services]
│   ├── utils/               # Utility functions
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── hooks/               # Custom React hooks (if applicable)
│   │   └── [custom-hooks]
│   ├── context/             # Context providers (if applicable)
│   │   └── [context-files]
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── styles/              # Global styles and themes
│   │   ├── globals.css
│   │   └── theme.ts
│   ├── assets/              # Static assets
│   │   ├── images/
│   │   └── icons/
│   └── index.tsx            # Application entry point
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── public/                  # Public static files
│   ├── index.html
│   └── favicon.ico
├── docs/                    # Documentation
│   ├── API.md
│   └── SETUP.md
├── .github/                 # GitHub-specific files
│   └── workflows/          # CI/CD workflows
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── .eslintrc.js            # ESLint configuration
├── .prettierrc             # Prettier configuration
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation
\`\`\`

## Implementation Phases

### Phase 1: Project Setup & Foundation (Week 1)
**Objectives:** Establish development environment and basic project structure
- [ ] Initialize project repository and set up version control
- [ ] Configure development environment (Node.js, package manager, etc.)
- [ ] Set up project structure with all necessary folders
- [ ] Install and configure core dependencies
- [ ] Set up linting and code formatting tools
- [ ] Create basic README with project overview
- [ ] Configure TypeScript/Babel if applicable
**Deliverables:** Working development environment, initialized project structure

### Phase 2: Core Infrastructure (Week 2)
**Objectives:** Build foundational components and services
- [ ] Implement basic routing structure
- [ ] Create reusable common components
- [ ] Set up state management solution
- [ ] Implement API service layer
- [ ] Configure authentication mechanism (if applicable)
- [ ] Set up error handling and logging
- [ ] Implement basic layout components
**Deliverables:** Core infrastructure components ready for feature development

### Phase 3: Feature Development (Weeks 3-5)
**Objectives:** Implement main application features
- [ ] Develop [Feature 1] with full CRUD operations
- [ ] Implement [Feature 2] with business logic
- [ ] Create [Feature 3] with user interactions
- [ ] Add data validation and error handling for each feature
- [ ] Implement responsive design for all features
- [ ] Add loading states and user feedback mechanisms
- [ ] Integrate with backend APIs (if applicable)
**Deliverables:** Fully functional features with complete user flows

### Phase 4: Testing & Quality Assurance (Week 6)
**Objectives:** Ensure code quality and reliability
- [ ] Write unit tests for all components (target: 80%+ coverage)
- [ ] Implement integration tests for key user flows
- [ ] Set up end-to-end testing suite
- [ ] Perform cross-browser testing
- [ ] Conduct responsive design testing on multiple devices
- [ ] Fix identified bugs and issues
- [ ] Code review and refactoring
**Deliverables:** Well-tested, production-ready codebase

### Phase 5: Polish & Optimization (Week 7)
**Objectives:** Optimize performance and enhance UX
- [ ] Optimize bundle size and loading performance
- [ ] Implement code splitting and lazy loading
- [ ] Add animations and transitions
- [ ] Optimize images and assets
- [ ] Implement caching strategies
- [ ] Add accessibility features (ARIA labels, keyboard navigation)
- [ ] Performance testing and optimization
**Deliverables:** Optimized, polished application

### Phase 6: Documentation & Deployment (Week 8)
**Objectives:** Prepare for production launch
- [ ] Write comprehensive API documentation
- [ ] Create user guide and tutorials
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment
- [ ] Implement monitoring and analytics
- [ ] Perform security audit
- [ ] Deploy to production
- [ ] Set up error tracking and logging
**Deliverables:** Deployed application with complete documentation

## Next Steps

### Immediate Actions (Start Today)
1. � **Set up development environment** (2 hours)
   - Install Node.js (v18+ recommended) and npm/yarn
   - Install preferred code editor (VS Code recommended)
   - Set up Git and create repository
   - *Depends on: None*

2. 🔴 **Initialize project structure** (1-2 hours)
   - Run project initialization command (create-react-app, vite, etc.)
   - Set up folder structure as outlined above
   - Install core dependencies
   - *Depends on: Development environment setup*

3. � **Configure development tools** (1-2 hours)
   - Set up ESLint and Prettier
   - Configure TypeScript (if applicable)
   - Add Git hooks with Husky
   - Create .env.example file
   - *Depends on: Project initialization*

### Week 1 Priorities
4. 🟡 **Create basic layout components** (4-6 hours)
   - Design and implement Header component
   - Design and implement Footer component
   - Create basic routing structure
   - *Depends on: Project structure and tools configuration*

5. 🟡 **Set up state management** (3-4 hours)
   - Choose and install state management library
   - Create store structure
   - Implement basic state slices
   - *Depends on: Project initialization*

6. 🟡 **Implement authentication flow** (6-8 hours)
   - Create login/signup components
   - Implement authentication service
   - Add protected route logic
   - Set up session management
   - *Depends on: State management and routing*

### Week 2 Priorities
7. 🟡 **Build core UI components** (8-10 hours)
   - Create reusable Button component with variants
   - Implement Input/Form components with validation
   - Build Modal/Dialog component
   - Create Loading and Error state components
   - *Depends on: Basic layout components*

8. 🟢 **Set up API integration layer** (4-6 hours)
   - Create API service with Axios/Fetch
   - Implement request/response interceptors
   - Add error handling middleware
   - *Depends on: Project structure*

9. 🟢 **Write initial documentation** (2-3 hours)
   - Update README with project info
   - Document component usage
   - Create setup instructions
   - *Depends on: Project initialization*

### Ongoing Tasks
10. 🟢 **Set up testing infrastructure** (4-6 hours)
    - Install testing libraries (Jest, React Testing Library)
    - Configure test environment
    - Write example tests
    - Set up test coverage reporting
    - *Depends on: Project initialization*

11. 🟢 **Implement CI/CD pipeline** (3-4 hours)
    - Create GitHub Actions workflow
    - Set up automated testing
    - Configure deployment pipeline
    - *Depends on: Project repository and testing setup*

## Testing Strategy

### Unit Testing
- Test all utility functions with 100% coverage
- Test React components with React Testing Library
- Mock external dependencies and API calls
- Target: 85%+ code coverage

### Integration Testing
- Test component interactions and data flow
- Verify API integration works correctly
- Test state management with multiple components
- Target: All critical user paths covered

### End-to-End Testing
- Use Playwright or Cypress for E2E tests
- Test complete user workflows
- Verify cross-browser compatibility
- Test responsive behavior on different screen sizes

## Deployment Strategy

### Development Environment
- Continuous deployment on feature branch merges
- Accessible at: [dev-url]
- Used for testing and QA

### Staging Environment
- Mirrors production configuration
- Final testing before production release
- Accessible at: [staging-url]

### Production Environment
- Deploy via CI/CD pipeline
- Automated rollback on deployment failures
- Monitor with error tracking (Sentry, etc.)
- Accessible at: [production-url]

## Maintenance & Future Enhancements

### Regular Maintenance
- Weekly dependency updates
- Monthly security audits
- Performance monitoring and optimization
- Bug fixes and minor improvements

### Future Feature Ideas
- [Future enhancement 1 with description]
- [Future enhancement 2 with description]
- [Future enhancement 3 with description]
- [Integration with external services]
- [Advanced features based on user feedback]

---

*Generated by Layr AI - Your AI-Powered Project Planning Assistant*`;

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 8000,
          top_p: 1,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API Error:', errorText);
        throw new AIServiceError(`Groq API request failed (${response.status}): ${errorText}`);
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content || '';
      
      if (!content) {
        throw new AIServiceError('Groq API returned empty response');
      }

      return content;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AIServiceError(`Failed to generate plan with Groq: ${errorMessage}`, error as Error);
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Groq API key validation error:', error);
      return false;
    }
  }

  getSupportedModels(): string[] {
    return [
      'llama-3.3-70b-versatile',      // Fast, versatile, recommended
      'llama-3.1-70b-versatile',      // Fast and versatile
      'llama-3.1-8b-instant',         // Ultra fast, good for simple tasks
      'mixtral-8x7b-32768',           // Good for long context
      'gemma2-9b-it',                 // Efficient instruction following
    ];
  }

  async isAvailable(): Promise<boolean> {
    return this.validateApiKey(this.apiKey);
  }
}
