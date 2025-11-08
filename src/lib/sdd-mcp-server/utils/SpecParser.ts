/**
 * SpecParser - Comprehensive specification parsing and extraction utility
 * Extracts structured data from spec.md markdown files including:
 * - User Stories (Comprehensive User Stories section)
 * - Scenarios (Happy Path, Negative, Edge Cases)
 * - Functional Requirements (FR-XXX format)
 * - Edge Cases
 */

export interface UserStory {
  id: string;
  number: number;
  content: string;
  persona?: string;
  goal?: string;
  benefit?: string;
}

export interface Scenario {
  id: string;
  type: 'happy_path' | 'negative' | 'edge_case';
  number: number;
  given: string;
  when: string;
  then: string;
  fullText: string;
}

export interface FunctionalRequirement {
  id: string;
  frNumber: string; // e.g., "FR-001"
  number: number; // e.g., 1
  content: string;
  description: string;
}

export interface EdgeCaseItem {
  id: string;
  number: number;
  content: string;
  question?: string; // For question-format edge cases
}

export interface ParsedSpecData {
  userStories: UserStory[];
  scenarios: {
    happyPath: Scenario[];
    negative: Scenario[];
    edgeCases: Scenario[];
  };
  functionalRequirements: FunctionalRequirement[];
  edgeCaseItems: EdgeCaseItem[];
  metadata: {
    totalUserStories: number;
    totalScenarios: number;
    totalFunctionalRequirements: number;
    totalEdgeCaseItems: number;
  };
}

export interface SpecCompletenessReport {
  isComplete: boolean;
  missingElements: {
    userStories: boolean;
    scenarios: boolean;
    functionalRequirements: boolean;
    edgeCases: boolean;
  };
  counts: {
    userStories: number;
    happyPathScenarios: number;
    negativeScenarios: number;
    edgeCaseScenarios: number;
    functionalRequirements: number;
    edgeCaseItems: number;
  };
  warnings: string[];
}

export class SpecParser {
  private static instance: SpecParser;

  private constructor() {}

  public static getInstance(): SpecParser {
    if (!SpecParser.instance) {
      SpecParser.instance = new SpecParser();
    }
    return SpecParser.instance;
  }

  /**
   * Parse complete spec.md markdown content into structured data
   */
  public parseSpec(specContent: string): ParsedSpecData {
    const userStories = this.extractUserStories(specContent);
    const scenarios = this.extractScenarios(specContent);
    const functionalRequirements = this.extractFunctionalRequirements(specContent);
    const edgeCaseItems = this.extractEdgeCaseItems(specContent);

    return {
      userStories,
      scenarios: {
        happyPath: scenarios.filter(s => s.type === 'happy_path'),
        negative: scenarios.filter(s => s.type === 'negative'),
        edgeCases: scenarios.filter(s => s.type === 'edge_case'),
      },
      functionalRequirements,
      edgeCaseItems,
      metadata: {
        totalUserStories: userStories.length,
        totalScenarios: scenarios.length,
        totalFunctionalRequirements: functionalRequirements.length,
        totalEdgeCaseItems: edgeCaseItems.length,
      },
    };
  }

  /**
   * Extract user stories from Comprehensive User Stories section
   * Format: Numbered list with "As a [persona], I want [goal] so that [benefit]"
   */
  public extractUserStories(specContent: string): UserStory[] {
    const userStories: UserStory[] = [];
    
    // Find Comprehensive User Stories section
    const userStoriesMatch = specContent.match(/###\s+Comprehensive\s+User\s+Stories\s*\n([\s\S]*?)(?=\n###|\n##|$)/i);
    if (!userStoriesMatch) {
      return userStories;
    }

    const userStoriesSection = userStoriesMatch[1];
    
    // Extract numbered list items (1., 2., etc.)
    const numberedListRegex = /^(\d+)\.\s+(.+?)(?=\n\d+\.|\n###|\n##|$)/gms;
    let match;
    let number = 1;

    while ((match = numberedListRegex.exec(userStoriesSection)) !== null) {
      const fullText = match[2].trim();
      
      // Parse "As a [persona], I want [goal] so that [benefit]"
      const personaMatch = fullText.match(/\*\*As\s+a\s+([^,]+)\*\*/i);
      const goalMatch = fullText.match(/I\s+want\s+(.+?)\s+so\s+that/i);
      const benefitMatch = fullText.match(/so\s+that\s+(.+?)(?:\.|$)/i);

      userStories.push({
        id: `US-${number.toString().padStart(3, '0')}`,
        number: parseInt(match[1], 10),
        content: fullText,
        persona: personaMatch ? personaMatch[1].trim() : undefined,
        goal: goalMatch ? goalMatch[1].trim() : undefined,
        benefit: benefitMatch ? benefitMatch[1].trim() : undefined,
      });
      number++;
    }

    return userStories;
  }

  /**
   * Extract scenarios from Acceptance Scenarios section
   * Format: Given-When-Then format under Happy Path, Negative, Edge Cases subsections
   */
  public extractScenarios(specContent: string): Scenario[] {
    const scenarios: Scenario[] = [];
    
    // Find Acceptance Scenarios section
    // Match until we hit a top-level ### (not ####) or ## section
    // Use negative lookahead to ensure we don't stop at #### subsections
    const scenariosMatch = specContent.match(/###\s+Acceptance\s+Scenarios\s*\n([\s\S]*?)(?=\n###\s+[^#\s]|\n##\s+[^#\s]|$)/i);
    if (!scenariosMatch) {
      return scenarios;
    }

    const scenariosSection = scenariosMatch[1];

    // Extract Happy Path Scenarios
    const happyPathScenarios = this.extractScenarioType(scenariosSection, 'happy_path', /####\s+Happy\s+Path\s+Scenarios\s*\n([\s\S]*?)(?=\n####|\n###|\n##|$)/i);
    scenarios.push(...happyPathScenarios);

    // Extract Negative Scenarios
    const negativeScenarios = this.extractScenarioType(scenariosSection, 'negative', /####\s+Negative\s+Scenarios\s*\n([\s\S]*?)(?=\n####|\n###|\n##|$)/i);
    scenarios.push(...negativeScenarios);

    // Extract Edge Case Scenarios
    const edgeCaseScenarios = this.extractScenarioType(scenariosSection, 'edge_case', /####\s+Edge\s+Cases\s*\n([\s\S]*?)(?=\n####|\n###|\n##|$)/i);
    scenarios.push(...edgeCaseScenarios);

    return scenarios;
  }

  /**
   * Extract scenarios of a specific type (happy_path, negative, edge_case)
   */
  private extractScenarioType(section: string, type: Scenario['type'], regex: RegExp): Scenario[] {
    const scenarios: Scenario[] = [];
    const match = section.match(regex);
    
    if (!match) {
      return scenarios;
    }

    const typeSection = match[1];
    
    // Extract numbered scenarios (1., 2., etc.) with Given-When-Then format
    // Handle both single-line format: "1. **Given** X **When** Y **Then** Z"
    // and multi-line format with separate lines
    
    // First try single-line format (most common)
    // Reset regex lastIndex to ensure we start from beginning
    const singleLineRegex = /^(\d+)\.\s+\*\*Given\*\*\s+(.+?)\s+\*\*When\*\*\s+(.+?)\s+\*\*Then\*\*\s+(.+?)(?=\n\d+\.|\n####|\n###|\n##|$)/gms;
    singleLineRegex.lastIndex = 0; // Reset regex state
    let scenarioMatch;
    let number = 1;

    while ((scenarioMatch = singleLineRegex.exec(typeSection)) !== null) {
      const fullText = scenarioMatch[0].trim();
      const given = scenarioMatch[2].trim();
      const when = scenarioMatch[3].trim();
      const then = scenarioMatch[4].trim();

      scenarios.push({
        id: `${type.toUpperCase()}-${number.toString().padStart(3, '0')}`,
        type,
        number: parseInt(scenarioMatch[1], 10),
        given,
        when,
        then,
        fullText,
      });
      number++;
    }

    // Also handle multi-line format with separate lines
    const multiLineRegex = /^(\d+)\.\s+\*\*(.+?)\*\*\s*\n\s*\*\*Given\*\*\s+(.+?)\s*\n\s*\*\*When\*\*\s+(.+?)\s*\n\s*\*\*Then\*\*\s+(.+?)(?=\n\d+\.|\n####|\n###|\n##|$)/gms;
    let multiLineMatch;
    number = 1;

    while ((multiLineMatch = multiLineRegex.exec(typeSection)) !== null) {
      const fullText = multiLineMatch[0].trim();
      const given = multiLineMatch[3].trim();
      const when = multiLineMatch[4].trim();
      const then = multiLineMatch[5].trim();

      scenarios.push({
        id: `${type.toUpperCase()}-${number.toString().padStart(3, '0')}`,
        type,
        number: parseInt(multiLineMatch[1], 10),
        given,
        when,
        then,
        fullText,
      });
      number++;
    }

    // Also handle scenarios without bold markers (simpler format)
    const simpleScenarioRegex = /^(\d+)\.\s+\*\*(.+?)\*\*\s*\n\s*Given\s+(.+?)\s*\n\s*When\s+(.+?)\s*\n\s*Then\s+(.+?)(?=\n\d+\.|\n####|\n###|\n##|$)/gms;
    let simpleMatch;
    number = 1;

    while ((simpleMatch = simpleScenarioRegex.exec(typeSection)) !== null) {
      const fullText = simpleMatch[0].trim();
      const given = simpleMatch[3].trim();
      const when = simpleMatch[4].trim();
      const then = simpleMatch[5].trim();

      scenarios.push({
        id: `${type.toUpperCase()}-${number.toString().padStart(3, '0')}`,
        type,
        number: parseInt(simpleMatch[1], 10),
        given,
        when,
        then,
        fullText,
      });
      number++;
    }

    return scenarios;
  }

  /**
   * Extract functional requirements from Requirements section
   * Format: Numbered list with "FR-XXX: [description]"
   */
  public extractFunctionalRequirements(specContent: string): FunctionalRequirement[] {
    const requirements: FunctionalRequirement[] = [];
    
    // Find Functional Requirements section
    const frMatch = specContent.match(/###\s+Functional\s+Requirements\s*\n([\s\S]*?)(?=\n###|\n##|$)/i);
    if (!frMatch) {
      return requirements;
    }

    const frSection = frMatch[1];
    
    // Extract numbered requirements with FR-XXX format
    // Pattern: "1. **FR-001**: The system shall..."
    const frRegex = /^(\d+)\.\s+\*\*(FR-\d+)\*\*:\s*(.+?)(?=\n\d+\.|\n###|\n##|$)/gms;
    let match;
    let number = 1;

    while ((match = frRegex.exec(frSection)) !== null) {
      const frNumber = match[2].trim();
      const description = match[3].trim();
      const fullContent = match[0].trim();

      requirements.push({
        id: frNumber,
        frNumber,
        number: parseInt(match[1], 10),
        content: fullContent,
        description,
      });
      number++;
    }

    return requirements;
  }

  /**
   * Extract edge case items from Edge Cases section
   * Format: Bulleted list or numbered list with questions/descriptions
   */
  public extractEdgeCaseItems(specContent: string): EdgeCaseItem[] {
    const edgeCases: EdgeCaseItem[] = [];
    
    // Find Edge Cases section (separate from Acceptance Scenarios)
    // Must be top-level ###, not #### subsection
    // Find all "### Edge Cases" matches and identify the one with bullet points (not Given-When-Then)
    const allMatches = [...specContent.matchAll(/###\s+Edge\s+Cases\s*\n([\s\S]*?)(?=\n###\s+[^#\s]|\n##\s+[^#\s]|$)/gi)];
    
    let edgeCasesMatch = null;
    for (const match of allMatches) {
      const section = match[1];
      // The standalone Edge Cases section has bullet points starting with "-"
      // The #### Edge Cases subsection has "Given-When-Then" format
      if (section.match(/^[-*•]\s+[^G]/m)) {
        edgeCasesMatch = match;
        break;
      }
    }
    
    if (!edgeCasesMatch) {
      return edgeCases;
    }

    const edgeCasesSection = edgeCasesMatch[1];
    
    // Extract bulleted list items (-, *, •)
    const bulletRegex = /^[-*•]\s+(.+?)(?=\n[-*•]|\n###|\n##|$)/gms;
    let match;
    let number = 1;

    while ((match = bulletRegex.exec(edgeCasesSection)) !== null) {
      const content = match[1].trim();
      const isQuestion = content.startsWith('What') || content.startsWith('How') || content.includes('?');

      edgeCases.push({
        id: `EC-${number.toString().padStart(3, '0')}`,
        number,
        content,
        question: isQuestion ? content : undefined,
      });
      number++;
    }
    
    // Also extract numbered list items that might be in edge cases section
    const numberedEdgeCaseRegex = /^(\d+)\.\s+(.+?)(?=\n\d+\.|\n[-*•]|\n###|\n##|$)/gms;
    let numberedEdgeCaseMatch;
    let numberedCount = 1;

    while ((numberedEdgeCaseMatch = numberedEdgeCaseRegex.exec(edgeCasesSection)) !== null) {
      const content = numberedEdgeCaseMatch[2].trim();
      const isQuestion = content.startsWith('What') || content.startsWith('How') || content.includes('?');

      edgeCases.push({
        id: `EC-${(number + numberedCount - 1).toString().padStart(3, '0')}`,
        number: parseInt(numberedEdgeCaseMatch[1], 10),
        content,
        question: isQuestion ? content : undefined,
      });
      numberedCount++;
    }

    return edgeCases;
  }

  /**
   * Validate spec completeness and generate report
   */
  public validateSpecCompleteness(parsedData: ParsedSpecData): SpecCompletenessReport {
    const warnings: string[] = [];
    
    // Check for minimum expected counts
    if (parsedData.userStories.length === 0) {
      warnings.push('No user stories found in Comprehensive User Stories section');
    } else if (parsedData.userStories.length < 5) {
      warnings.push(`Only ${parsedData.userStories.length} user stories found (expected 8-10)`);
    }

    if (parsedData.scenarios.happyPath.length === 0) {
      warnings.push('No Happy Path scenarios found');
    }

    if (parsedData.scenarios.negative.length === 0) {
      warnings.push('No Negative scenarios found');
    }

    if (parsedData.functionalRequirements.length === 0) {
      warnings.push('No Functional Requirements (FR-XXX) found');
    }

    if (parsedData.edgeCaseItems.length === 0 && parsedData.scenarios.edgeCases.length === 0) {
      warnings.push('No Edge Cases found');
    }

    return {
      isComplete: warnings.length === 0,
      missingElements: {
        userStories: parsedData.userStories.length === 0,
        scenarios: parsedData.scenarios.happyPath.length === 0 && parsedData.scenarios.negative.length === 0,
        functionalRequirements: parsedData.functionalRequirements.length === 0,
        edgeCases: parsedData.edgeCaseItems.length === 0 && parsedData.scenarios.edgeCases.length === 0,
      },
      counts: {
        userStories: parsedData.userStories.length,
        happyPathScenarios: parsedData.scenarios.happyPath.length,
        negativeScenarios: parsedData.scenarios.negative.length,
        edgeCaseScenarios: parsedData.scenarios.edgeCases.length,
        functionalRequirements: parsedData.functionalRequirements.length,
        edgeCaseItems: parsedData.edgeCaseItems.length,
      },
      warnings,
    };
  }
}

