/**
 * JSON Repair Utility
 * Shared utility for robust JSON repair across all SDD tools
 * Uses professional jsonrepair library with fallback cleaning
 */

import { jsonrepair } from 'jsonrepair';

export class JsonRepairUtility {
  /**
   * Repair malformed JSON content using professional jsonrepair library
   * Handles complex JSON issues including LLM-generated content
   * 
   * @param content - The JSON content to repair (string or object)
   * @param toolName - Name of the tool calling this method (for logging)
   * @returns Repaired JSON string or original content if repair fails
   */
  static repairJsonContent(content: any, toolName: string = 'SDDTool'): string {
    if (typeof content !== 'string') {
      return content;
    }

    try {
      // First try to parse as-is
      JSON.parse(content);
      return content; // Already valid JSON
    } catch (error) {
      try {
        // Use professional jsonrepair library for robust repair
        const repairedContent = jsonrepair(content);
        console.log(`[${toolName}] JSON repaired successfully`);
        return repairedContent;
      } catch (repairError) {
        // If repair fails, try our fallback cleaning method
        console.error(`[${toolName}] JSON repair failed, trying fallback cleaning:`, repairError.message);
        
        const cleanedContent = content
          .replace(/\n/g, '\\n')           // Escape newlines
          .replace(/\r/g, '\\r')          // Escape carriage returns
          .replace(/\t/g, '\\t')          // Escape tabs
          .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters

        try {
          JSON.parse(cleanedContent);
          console.log(`[${toolName}] JSON cleaned successfully using fallback method`);
          return cleanedContent;
        } catch (fallbackError) {
          console.error(`[${toolName}] Fallback cleaning also failed:`, fallbackError.message);
          return content; // Return original content as last resort
        }
      }
    }
  }

  /**
   * Safely parse JSON content with repair if necessary
   * 
   * @param content - The JSON content to parse
   * @param toolName - Name of the tool calling this method (for logging)
   * @returns Parsed JSON object or null if parsing fails
   */
  static safeParseJson(content: any, toolName: string = 'SDDTool'): any {
    if (typeof content === 'object') {
      return content; // Already parsed
    }

    if (typeof content !== 'string') {
      console.error(`[${toolName}] Invalid content type for JSON parsing:`, typeof content);
      return null;
    }

    try {
      // First try to parse as-is
      return JSON.parse(content);
    } catch (error) {
      try {
        // Try to repair and parse
        const repairedContent = this.repairJsonContent(content, toolName);
        return JSON.parse(repairedContent);
      } catch (repairError) {
        console.error(`[${toolName}] Failed to parse JSON even after repair:`, repairError.message);
        return null;
      }
    }
  }

  /**
   * Validate and repair JSON content from database
   * Specifically designed for database-retrieved content that might be malformed
   * 
   * @param dbContent - Content retrieved from database
   * @param toolName - Name of the tool calling this method (for logging)
   * @returns Validated and repaired JSON object or null if validation fails
   */
  static validateAndRepairDbContent(dbContent: any, toolName: string = 'SDDTool'): any {
    if (!dbContent) {
      return null;
    }

    // If it's already an object, return as-is
    if (typeof dbContent === 'object') {
      return dbContent;
    }

    // If it's a string, try to parse with repair
    if (typeof dbContent === 'string') {
      return this.safeParseJson(dbContent, toolName);
    }

    console.error(`[${toolName}] Unexpected database content type:`, typeof dbContent);
    return null;
  }

  /**
   * Extract JSON content from database result with repair if necessary
   * Handles both direct content and wrapped content structures
   * 
   * @param dbResult - Database query result
   * @param toolName - Name of the tool calling this method (for logging)
   * @returns Extracted and repaired JSON content or null if extraction fails
   */
  static extractDbJsonContent(dbResult: any, toolName: string = 'SDDTool'): any {
    if (!dbResult) {
      return null;
    }

    // Handle different database result structures
    if (dbResult.content) {
      // Direct content field
      return this.validateAndRepairDbContent(dbResult.content, toolName);
    } else if (dbResult.data) {
      // Wrapped data field
      return this.validateAndRepairDbContent(dbResult.data, toolName);
    } else if (typeof dbResult === 'object') {
      // Direct object
      return dbResult;
    } else if (typeof dbResult === 'string') {
      // Direct string
      return this.safeParseJson(dbResult, toolName);
    }

    console.error(`[${toolName}] Unexpected database result structure:`, Object.keys(dbResult));
    return null;
  }
}
