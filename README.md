# SDD MCP Server - Specification-Driven Development

## Table of Contents

1. [Introduction](#introduction)
2. [Common Requirements](#common-requirements)
3. [Technical Implementation](#technical-implementation)
4. [Phase 1: Contract & Test Setup](#phase-1-contract--test-setup)
5. [Phase 2: Database Setup](#phase-2-database-setup)
6. [Phase 3: Data Models](#phase-3-data-models)
7. [Phase 4: Library Implementation](#phase-4-library-implementation)
8. [Phase 5: Application Integration](#phase-5-application-integration)
9. [Phase 6: UI-API Integration (Comprehensive)](#phase-6-ui-api-integration-comprehensive)
10. [Phase 7: Platform-Specific Implementation](#phase-7-platform-specific-implementation)
11. [Phase 8: API-First Integration](#phase-8-api-first-integration)
12. [Contributing](#contributing)
13. [License](#license)

## Introduction

The SDD MCP Server implements a comprehensive Specification-Driven Development methodology with Test-Driven Development (TDD) enforcement. This system provides structured guidance for implementing software projects through 8 distinct phases, each with specific objectives and deliverables.

**Key Features:**
- **90% Instruction Reduction**: Dynamic phase-specific instructions (862 → 86 lines)
- **Switch Case Approach**: Dynamic instruction generation based on phase
- **TDD Enforcement**: Mandatory test-first development approach
- **Constitutional Gates**: Built-in quality and compliance checks
- **Platform Agnostic**: Works across multiple development platforms
- **Comprehensive Integration**: Complete UI-API integration in single phase
- **Phase Optimization**: Merged Phase 6 and 9 for comprehensive UI-API integration

## Common Requirements

Before proceeding with individual phases, ensure the following common requirements are met:

### TDD Enforcement
- **MANDATORY**: No implementation before tests
- **SEQUENCE**: Contract → Integration → E2E → Unit → Implementation
- **RED PHASE**: Write tests first, watch them fail
- **GREEN PHASE**: Write minimal code to make tests pass
- **REFACTOR PHASE**: Improve code while keeping tests green

### Quality Gates
- **Tests Required**: All code must have tests
- **Documentation**: Update relevant documentation
- **Linting**: No linting errors allowed
- **Traceability**: Every line traces to requirement
- **No Placeholders**: Real functionality only

### Validation Requirements
- **Evidence Required**: Show test output, file structure
- **Completion Criteria**: Clear success indicators
- **Progress Tracking**: Update status after each task
- **Role-Based Testing**: Test from different user perspectives

### Constitutional Compliance
- **Test-First Gate**: No implementation before tests
- **Integration-First Gate**: Prefer real dependencies
- **Library-First Gate**: Start as standalone library (desktop/backend) or modular component (web/mobile/embedded)
- **CLI Interface Gate**: Expose CLI with --json mode (for developer/system tools)
- **Anti-Abstraction Gate**: One domain model
- **Traceability Gate**: Every line traces to requirement

### Error Handling
- **IF PHASE FAILS**: Identify issue, fix, retry
- **IF TOOL CALL FAILS**: Check phase parameter, verify completion
- **IF TESTS FAIL**: Fix code, don't skip tests
- **IF DEPENDENCIES MISSING**: Install before proceeding

## Technical Implementation

### Switch Case Approach
The system uses a switch case approach to generate phase-specific instructions dynamically:

- **Phase-Specific Instructions**: 28 lines per phase (unique content for each phase)
- **Common Requirements**: 39 lines (shared across all phases)  
- **Data Sections**: 19 lines (system instruction + data)
- **Total per Phase**: 86 lines (vs. 862 lines in previous approach)

### Phase Optimization
- **Phase 6**: Merged with Phase 9 for comprehensive UI-API integration
- **Total Phases**: Reduced from 9 to 8 phases
- **Task Coverage**: All original tasks maintained with better organization
- **Instruction Efficiency**: 90% reduction through dynamic content generation

### Dynamic Content Generation
Each phase call generates:
1. **Phase-Specific Instructions**: Unique objectives, tasks, requirements, and success criteria
2. **Common Requirements**: TDD enforcement, quality gates, validation, constitutional compliance
3. **Data Sections**: System instruction, task data, specification data, plan data

## Phase 1: Contract & Test Setup

### Objective
Establish contracts and initial tests as the foundation for the entire project.

### Instructions
1. **Create API Contracts** (TASK-001)
   - Define API interfaces and schemas
   - Establish contract specifications
   - Validate contract compliance

2. **Create Contract Tests** (TASK-002)
   - Write tests for API contracts
   - Ensure contract validation
   - Verify contract compliance

3. **Create Integration Test Scenarios** (TASK-003)
   - Define integration test cases
   - Plan integration testing approach
   - Prepare integration test framework

### Phase-Specific Requirements
- **Contract-First**: Define APIs before implementation
- **Test-First**: Write tests before any code
- **Schema Validation**: Ensure contract compliance

### Success Criteria
- [ ] API contracts created and validated
- [ ] Contract tests written and passing
- [ ] Integration scenarios defined
- [ ] Ready for Phase 2 (Database Setup)

## Phase 2: Database Setup

### Objective
Establish database foundation and prepare for data layer implementation.

### Instructions
1. **Database Setup** (TASK-004)
   - Configure database connection
   - Set up database environment
   - Verify database accessibility

2. **Schema Design** (TASK-005)
   - Design data models and relationships
   - Create database schema
   - Validate schema design

3. **Migration Setup** (TASK-006)
   - Prepare database migration system
   - Set up schema evolution
   - Test migration procedures

### Phase-Specific Requirements
- **Database-First**: Set up data layer before application
- **Migration-Ready**: Prepare for schema evolution
- **Performance**: Consider indexing and optimization

### Success Criteria
- [ ] Database configured and accessible
- [ ] Schema designed and validated
- [ ] Migration system ready
- [ ] Ready for Phase 3 (Data Models)

## Phase 3: Data Models

### Objective
Create domain models and validation logic for data integrity.

### Instructions
1. **Create Data Models** (TASK-007)
   - Define domain models
   - Implement data structures
   - Create model relationships

2. **Create Model Tests** (TASK-008)
   - Write tests for data models
   - Test model validation
   - Verify model integrity

### Phase-Specific Requirements
- **Model-First**: Define data structures before implementation
- **Validation**: Implement business rule validation
- **Testing**: Ensure model integrity

### Success Criteria
- [ ] Data models created and validated
- [ ] Model tests written and passing
- [ ] Validation logic implemented
- [ ] Ready for Phase 4 (Library Implementation)

## Phase 4: Library Implementation

### Objective
Implement core business functionality as reusable library components.

### Instructions
1. **Implement Core Library** (TASK-009)
   - Create business logic library
   - Implement core functionality
   - Ensure library reusability

2. **Create CLI Interface** (TASK-010)
   - Expose functionality via CLI
   - Implement --json mode
   - Create command-line interface

3. **Library Integration Tests** (TASK-011)
   - Test library functionality
   - Verify integration points
   - Ensure library reliability

### Phase-Specific Requirements
- **Library-First**: Create reusable components
- **CLI Interface**: Expose functionality via CLI (for developer/system tools)
- **Testing**: Comprehensive library testing

### Success Criteria
- [ ] Core library implemented and tested
- [ ] CLI interface functional
- [ ] Integration tests passing
- [ ] Ready for Phase 5 (Application Integration)

## Phase 5: Application Integration

### Objective
Create user-facing functionality and connect all components.

### Instructions
1. **Application Layer** (TASK-012)
   - Create user-facing functionality
   - Implement application logic
   - Connect user interface

2. **End-to-End Validation** (TASK-013)
   - Test complete system functionality
   - Verify end-to-end workflows
   - Ensure system integration

### Phase-Specific Requirements
- **Application-First**: Create user-facing functionality
- **Integration**: Connect all components
- **Validation**: End-to-end system validation

### Success Criteria
- [ ] Application layer implemented
- [ ] End-to-end validation complete
- [ ] All components integrated
- [ ] Ready for Phase 6 (UI-API Integration)

## Phase 6: UI-API Integration (Comprehensive)

### Objective
Complete comprehensive UI-API integration with error handling and testing.

### Instructions
1. **API Client Setup** (TASK-014)
   - Configure API client
   - Set up HTTP client
   - Prepare API communication

2. **UI-API Connection Implementation** (TASK-015)
   - Implement UI-API connection
   - Create data flow logic
   - Establish communication protocols

3. **API Data Flow Integration** (TASK-016)
   - Implement data flow
   - Handle data transformation
   - Ensure data consistency

4. **API Error Handling Implementation** (TASK-017)
   - Implement comprehensive error handling
   - Create error recovery mechanisms
   - Handle edge cases

5. **UI-API Integration Testing** (TASK-018)
   - Test complete integration
   - Verify error handling
   - Ensure reliability

### Phase-Specific Requirements
- **Complete Integration**: Full UI-API connection
- **Error Handling**: Comprehensive error management
- **Testing**: Complete integration testing

### Success Criteria
- [ ] API client configured and working
- [ ] UI-API connection implemented
- [ ] Data flow working correctly
- [ ] Error handling implemented
- [ ] Integration tests passing
- [ ] Ready for Phase 7 (Platform-Specific)

## Phase 7: Platform-Specific Implementation

### Objective
Optimize for specific platform and implement platform-specific capabilities.

### Instructions
1. **Platform-Specific Setup** (TASK-019)
   - Configure platform-specific settings
   - Set up platform environment
   - Prepare platform integration

2. **Platform-Specific Testing** (TASK-020)
   - Test platform-specific functionality
   - Verify platform compatibility
   - Ensure platform reliability

3. **Platform-Specific Optimization** (TASK-021)
   - Optimize for platform performance
   - Implement platform features
   - Enhance platform experience

### Phase-Specific Requirements
- **Platform-Aware**: Optimize for specific platform
- **Feature Implementation**: Platform-specific capabilities
- **Testing**: Platform-specific testing

### Success Criteria
- [ ] Platform-specific setup complete
- [ ] Platform-specific testing passing
- [ ] Platform optimization implemented
- [ ] Ready for Phase 8 (API-First Integration)

## Phase 8: API-First Integration

### Objective
Design comprehensive API and complete final integration.

### Instructions
1. **API Design Implementation** (TASK-022)
   - Design comprehensive API
   - Implement API structure
   - Create API endpoints

2. **API Contract Implementation** (TASK-023)
   - Implement API contracts
   - Create request/response schemas
   - Validate API contracts

3. **API Testing Implementation** (TASK-024)
   - Test API functionality
   - Verify API reliability
   - Ensure API performance

### Phase-Specific Requirements
- **API-First**: Design comprehensive API
- **Testing**: Test API functionality
- **Documentation**: Document API usage

### Success Criteria
- [ ] API design implemented
- [ ] API contracts implemented
- [ ] API testing complete
- [ ] API documentation complete
- [ ] **PROJECT COMPLETE**

## Contributing

### Development Guidelines
- Follow TDD principles strictly
- Ensure all code has comprehensive tests
- Maintain constitutional compliance
- Update documentation for all changes
- Follow the 8-phase development process

### Code Standards
- No implementation before tests
- All code must trace to requirements
- Use real dependencies over mocks
- Implement CLI interfaces with --json mode (for developer/system tools)
- Maintain single domain model

### Pull Request Process
1. Ensure all phases are completed
2. Verify all tests pass
3. Check constitutional compliance
4. Update documentation
5. Submit pull request with phase completion evidence

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This README consolidates the dynamic phase-specific instructions and common requirements from the SDD MCP Server implementation. Each phase provides clear objectives, specific tasks, requirements, and success criteria to ensure comprehensive software development following TDD principles.