# 📋 Project Setup & Foundations

## 📊 Metadata
- **Generated**: 2025-10-29
- **Platform**: mobile
- **Phase**: Phase 1
- **Tasks**: 18 tasks (TASK-001 to TASK-018)
- **Status**: in_progress

## 💡 Phase 1 Task Estimates

### Phase Overview
- **Phase**: Phase 1 - Project Setup & Foundations
- **Tasks**: 18 tasks (TASK-001 to TASK-018)
- **Estimated Duration**: ~1-2 weeks (human development)
- **AI Time**: ~2 hours for all 18 tasks
- **Focus**: Setup tasks include project structure, dependencies, environment, API specifications, and database schema. Testing includes RED phase with failing tests.

### 📋 Implementation Tasks

### TASK-001 [TASK-001] CONFIGURE React Native Expo Project Structure & SHOW Directory Layout

#### Task Details
- **TDD Phase**: Setup
- **Sub Phase**: Project_Configuration
- **Dependencies**: None
- **Parallelizable**: false

#### Description
CONFIGURE project directory structure with proper organization for React Native Expo mobile app following the plan structure. CREATE all required directories: app/ (Expo Router), src/lib/, src/components/, src/services/, src/hooks/, src/utils/, src/theme/, contracts/, tests/ (contract, integration, e2e, unit), functions/ (Firebase Cloud Functions). SHOW complete directory tree with all required folders matching the specification.

#### Requirements
- Project structure must match the exact structure defined in plan.md
- All directories must be created: app/, src/lib/, src/components/, tests/, contracts/, functions/
- Directory organization must support mobile app development (Expo Router structure)
- Clear separation between library code (lib/), UI components (components/), and tests

#### Acceptance Criteria
- Project structure created with all required directories present
- app/ directory contains Expo Router structure
- src/ directory contains lib/, components/, services/, hooks/, utils/, theme/ subdirectories
- tests/ directory contains contract/, integration/, e2e/, unit/ subdirectories
- contracts/ directory exists for API specifications
- functions/ directory exists for Firebase Cloud Functions
- Clear organization established matching plan.md structure

#### Estimates
- **Duration**: 15min
- **Lines of Code**: 0-10

#### Verification
- **Type**: directory_structure_confirmation
- **Action**: SHOW
- **Commands**: 
  - `find . -type d -name 'app' -o -name 'src' -o -name 'tests' -o -name 'contracts' -o -name 'functions' | sort`
  - `tree -L 3 -d || find . -type d -maxdepth 3 | head -30`
  - `ls -la app/ src/ tests/ contracts/ functions/ 2>/dev/null || echo "Some directories missing"`
  - `CRITICAL: Verify ALL directories from plan.md are created`
- **Expected State**: Project structure visible with all required directories. MANDATORY: Verify source code + tests + documentation + configuration all present. Must match exact structure from plan.md.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output
  - Must Include: ["app", "src", "tests", "contracts", "functions", "lib", "components", "VERIFIED: All requirement directories present"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-001 verification complete! Proceed immediately to TASK-002 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-001 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-002!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-002

---

### TASK-002 [TASK-002] SETUP React Native Expo Development Environment & SHOW Dependencies Installed

#### Task Details
- **TDD Phase**: Setup
- **Sub Phase**: Environment_Configuration
- **Dependencies**: TASK-001
- **Parallelizable**: false

#### Description
SETUP React Native Expo development environment with all necessary tools, frameworks, and dependencies. INITIALIZE Expo project with TypeScript template: `npx create-expo-app@latest food-lens --template blank-typescript`. INSTALL all required dependencies: @react-native-firebase packages, expo-camera, expo-image-picker, React Navigation, React Native Reanimated, NativeWind, Zustand, React Query, expo-secure-store, Jest, React Native Testing Library. CONFIGURE package.json with all scripts. SHOW successful installation of all required packages. MANDATORY: All tools AND all frameworks AND all dependencies must be installed, not just some!

#### Requirements
- Expo SDK 51+ initialized with TypeScript template
- Firebase packages installed (@react-native-firebase/app, /auth, /firestore, /storage)
- Camera packages installed (expo-camera, expo-image-picker)
- Navigation installed (@react-navigation/native, @react-navigation/bottom-tabs)
- Animation packages installed (react-native-reanimated, react-native-gesture-handler)
- Styling installed (nativewind, tailwindcss)
- State management installed (zustand, @tanstack/react-query)
- Security installed (expo-secure-store)
- Testing installed (jest, @testing-library/react-native, @testing-library/jest-native)
- All package.json scripts configured

#### Acceptance Criteria
- Development environment configured with Expo CLI
- ALL tools installed (Node.js, npm/yarn, Expo CLI)
- ALL frameworks installed (React Native, Expo SDK 51+)
- ALL dependencies installed and listed in package.json
- package.json contains all required scripts (start, test, build, etc.)
- Tools working properly (verify with `npx expo --version`)
- Verify ALL requirements before marking complete!

#### Estimates
- **Duration**: 30min
- **Lines of Code**: 50-100

#### Verification
- **Type**: environment_setup_confirmation
- **Action**: SHOW
- **Commands**: 
  - `npx expo --version`
  - `cat package.json | grep -A 50 '"dependencies"'`
  - `npm list --depth=0 | grep -E "(expo|react-native|firebase|navigation|reanimated|nativewind|zustand|tanstack|secure-store|jest|testing-library)"`
  - `npm run --silent 2>&1 | head -20`
  - `CRITICAL: Verify ALL tools AND ALL frameworks AND ALL dependencies`
- **Expected State**: Development environment operational with all dependencies. MANDATORY: ALL tools + ALL frameworks + ALL dependencies must be verified. package.json must contain all required packages.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output
  - Must Include: ["dependencies", "installed", "expo", "react-native", "firebase", "environment", "ready", "VERIFIED: All requirements"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-002 verification complete! Proceed immediately to TASK-003 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-002 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-003!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-003

---

### TASK-003 [TASK-003] CONFIGURE Environment Variables & SHOW Settings

#### Task Details
- **TDD Phase**: Setup
- **Sub Phase**: Configuration_Management
- **Dependencies**: TASK-002
- **Parallelizable**: false

#### Description
CONFIGURE environment variables for React Native Expo development, testing, and production environments. CREATE .env.example with all required variables: Firebase configuration (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId), OpenAI API key, Google Gemini API key, Firebase project configuration. CREATE .env.local (gitignored) for local development. CONFIGURE Expo environment variable loading using expo-constants or react-native-config. DOCUMENT all required environment variables in README.md. SHOW all configured settings and variables.

#### Requirements
- .env.example created with all required variables (Firebase config, API keys)
- .env.local created (gitignored) for local development
- Environment variable loading configured for Expo
- README.md documents all required environment variables
- Firebase configuration variables included
- AI model API keys included (OpenAI, Gemini)
- Environment-specific configurations (dev, test, prod)

#### Acceptance Criteria
- Environment variables configured for all environments (dev, test, prod)
- .env.example includes all required variables with placeholders
- .env.local exists and is gitignored
- Environment variable loading works in Expo app
- Settings documented in README.md
- All environments covered

#### Estimates
- **Duration**: 20min
- **Lines of Code**: 20-50

#### Verification
- **Type**: environment_configuration_confirmation
- **Action**: SHOW
- **Commands**: 
  - `cat .env.example`
  - `grep -v "^#" .env.example | grep -v "^$" | wc -l`
  - `cat .gitignore | grep "\.env\.local"`
  - `cat README.md | grep -A 10 "Environment Variables" || echo "README section missing"`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: Environment variables configured and visible. MANDATORY: All requirements from description must be verified. .env.example must contain Firebase config and API keys.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output_and_files
  - Must Include: ["environment", "variables", "configuration", "settings", ".env.example", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-003 verification complete! Proceed immediately to TASK-004 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-003 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-004!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-004

---

### TASK-004 [TASK-004] CREATE OpenAPI Specification & SHOW Validation Pass

#### Task Details
- **TDD Phase**: Contract
- **Sub Phase**: API_Definition
- **Dependencies**: TASK-003
- **Parallelizable**: false

#### Description
CREATE OpenAPI 3.0 specification file (contracts/openapi.yaml) with complete API definition for the food label scanner mobile app. DEFINE all API endpoints: /api/v1/auth/register, /api/v1/auth/login, /api/v1/auth/refresh, /api/v1/scans (POST, GET), /api/v1/scans/{scanId} (GET, DELETE), /api/v1/ai/process-image (POST), /api/v1/user/preferences (GET, PUT). DEFINE request/response schemas for all endpoints including ScanRequest, ScanResponse, Error schemas. INCLUDE authentication (Bearer token), validation rules, error responses. VALIDATE contract using openapi-validator or similar tool. CONFIRM contract validates with 0 errors. SHOW validation passes successfully.

#### Requirements
- OpenAPI 3.0 specification file created at contracts/openapi.yaml
- All API endpoints defined (auth, scans, ai, user preferences)
- Request/response schemas defined (ScanRequest, ScanResponse, Error)
- Authentication defined (Bearer token)
- Validation rules included
- Error responses defined
- OpenAPI spec validates with 0 errors

#### Acceptance Criteria
- OpenAPI specification created with all endpoints
- Validation passes with 0 errors
- API definition complete with schemas
- All endpoints match specification requirements
- Authentication and error handling defined

#### Estimates
- **Duration**: 45min
- **Lines of Code**: 200-400

#### Verification
- **Type**: api_specification_validation
- **Action**: SHOW
- **Commands**: 
  - `cat contracts/openapi.yaml | head -50`
  - `npx @apidevtools/swagger-cli validate contracts/openapi.yaml || npm install -g swagger-cli && swagger-cli validate contracts/openapi.yaml`
  - `grep -c "paths:" contracts/openapi.yaml || echo "paths section missing"`
  - `grep -c "components:" contracts/openapi.yaml || echo "components section missing"`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: OpenAPI specification valid and complete. MANDATORY: All requirements from description must be verified. Validation must show 0 errors.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output_and_files
  - Must Include: ["validation", "passed", "openapi", "specification", "0 errors", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-004 verification complete! Proceed immediately to TASK-005 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-004 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-005!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-005

---

### TASK-005 [TASK-005] SETUP Firebase Project & DEFINE Firestore Schema & EXECUTE Initialization

#### Task Details
- **TDD Phase**: Contract
- **Sub Phase**: Database_Definition
- **Dependencies**: TASK-004
- **Parallelizable**: false

#### Description
SETUP Firebase project via Firebase Console AND configure Firebase CLI AND DEFINE complete Firestore database schema with all collections (users, scans), document structures, relationships, indexes (userId + scannedAt composite, userId + productName composite), and security rules AND EXECUTE Firebase initialization AND SHOW schema definition. MANDATORY: You MUST complete ALL 5 steps - do not stop after just installing Firebase! For React Native, configure Firebase using @react-native-firebase packages and firebase.json.

#### Requirements
- Firebase project created via Firebase Console
- Firebase CLI configured (firebase login, firebase init)
- firebase.json and .firebaserc created
- Firestore schema defined: users collection (userId, email, displayName, preferredLanguage, preferredModel, createdAt, lastLoginAt), scans collection (scanId, userId, imageUrl, scannedAt, productName, nutritionData, allergenData, alternativesData, processedAt, modelUsed)
- Composite indexes defined: userId + scannedAt, userId + productName
- Security rules defined (users can only access their own scans)
- Firebase configuration file created (firebase.json, .firebaserc)
- React Native Firebase initialized

#### Acceptance Criteria
- Firebase project created and configured
- Firebase CLI configured and authenticated
- Firestore schema defined with all collections and fields
- Indexes defined (userId + scannedAt, userId + productName composite)
- Security rules configured
- firebase.json and .firebaserc files created
- Firebase initialization executed successfully
- Tables created, relationships established
- Verify ALL 7 requirements before marking complete!

#### Estimates
- **Duration**: 60min
- **Lines of Code**: 150-300

#### Verification
- **Type**: database_setup_confirmation
- **Action**: EXECUTE
- **Commands**: 
  - `cat firebase.json`
  - `cat .firebaserc`
  - `firebase projects:list || echo "Firebase CLI not configured"`
  - `ls -la firestore.rules firestore.indexes.json 2>/dev/null || echo "Firestore files missing"`
  - `cat firestore.rules | head -30 || echo "Security rules not created"`
  - `cat firestore.indexes.json || echo "Indexes file not created"`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: Firebase project operational, connection verified, schema created and validated. MANDATORY: All requirements from description must be verified. Firestore collections, indexes, and security rules must be defined.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output_and_database_schema
  - Must Include: ["firebase", "project", "connection", "schema", "firestore", "collections", "indexes", "security rules", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-005 verification complete! Proceed immediately to TASK-006 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-005 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-006!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-006

---

### TASK-006 [TASK-006] CREATE Data Model Classes & COMPILE

#### Task Details
- **TDD Phase**: Contract
- **Sub Phase**: Model_Definition
- **Dependencies**: TASK-005
- **Parallelizable**: false

#### Description
CREATE data model classes in TypeScript that represent Firestore database entities (User, Scan, NutritionCard, AllergenInfo, AlternativeProduct) with proper relationships, validation, and business logic matching the Firestore schema. CREATE models in src/lib/scan/scan.model.ts, src/lib/nutrition/nutrition.model.ts, src/lib/allergen/allergen.model.ts, src/lib/alternatives/alternatives.model.ts. IMPLEMENT validation methods, serialization/deserialization for Firestore. COMPILE TypeScript code and SHOW successful compilation with 0 errors.

#### Requirements
- Scan model created (src/lib/scan/scan.model.ts) matching Firestore schema
- NutritionCard model created (src/lib/nutrition/nutrition.model.ts)
- AllergenInfo model created (src/lib/allergen/allergen.model.ts)
- AlternativeProduct model created (src/lib/alternatives/alternatives.model.ts)
- Models include validation methods
- Models include Firestore serialization/deserialization
- TypeScript compilation successful with 0 errors
- Models include FR-XXX traceability comments

#### Acceptance Criteria
- Data model classes created with all entities
- Relationships defined (User → Scans)
- Validation implemented for all models
- Firestore serialization/deserialization working
- Compilation successful with 0 errors
- Models match Firestore schema from TASK-005

#### Estimates
- **Duration**: 45min
- **Lines of Code**: 300-500

#### Verification
- **Type**: data_model_compilation
- **Action**: COMPILE
- **Commands**: 
  - `npx tsc --noEmit`
  - `find src/lib -name "*.model.ts" | wc -l`
  - `cat src/lib/scan/scan.model.ts | head -50`
  - `grep -r "FR-" src/lib --include="*.ts" | head -10`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: Data model classes compiled successfully with no errors. MANDATORY: All requirements from description must be verified. TypeScript compilation must show 0 errors.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output_and_code
  - Must Include: ["compilation", "successful", "models", "classes", "relationships", "0 errors", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-006 verification complete! Proceed immediately to TASK-007 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-006 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-007!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-007

---

### TASK-007 [TASK-007] CREATE Contract Tests & SHOW Test Files

#### Task Details
- **TDD Phase**: RED
- **Sub Phase**: Test_Creation
- **Dependencies**: TASK-006
- **Parallelizable**: false

#### Description
CREATE comprehensive contract tests in tests/contract/ that verify API endpoints match the OpenAPI specification. INSTALL contract testing tools (dredd or schemathesis). WRITE contract tests validating: OpenAPI spec structure, request/response schemas, endpoint definitions, authentication requirements. CREATE tests/contract/api-contracts.test.ts and tests/contract/schema-validation.test.ts. RUN tests. CONFIRM tests fail initially (RED phase). SHOW all test files created and test case count.

#### Requirements
- Contract test files created in tests/contract/
- Contract testing tool installed (dredd or schemathesis)
- Tests validate OpenAPI spec structure
- Tests validate request/response schemas
- Tests validate endpoint definitions
- Tests fail initially (RED phase - no implementation yet)
- Test files: api-contracts.test.ts, schema-validation.test.ts

#### Acceptance Criteria
- Contract test files created with comprehensive coverage
- API endpoints covered in tests
- Test cases comprehensive (all endpoints tested)
- Tests fail as expected (RED phase)
- Test tool installed and configured
- Test case count visible

#### Estimates
- **Duration**: 40min
- **Lines of Code**: 150-300

#### Verification
- **Type**: contract_test_creation
- **Action**: SHOW
- **Commands**: 
  - `ls -la tests/contract/`
  - `find tests/contract -name "*.test.ts" -o -name "*.spec.ts" | wc -l`
  - `npm test -- tests/contract --listTests 2>&1 | head -20`
  - `npm test -- tests/contract 2>&1 | tail -30`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: Contract tests created and failing as expected. MANDATORY: All requirements from description must be verified. Tests must be in RED state (failing).
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output_and_files
  - Must Include: ["test files", "contract tests", "test cases", "failing tests", "RED", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-007 verification complete! Proceed immediately to TASK-008 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-007 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-008!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-008

---

### TASK-008 [TASK-008] CREATE Model Tests & SHOW Test Count

#### Task Details
- **TDD Phase**: RED
- **Sub Phase**: Test_Creation
- **Dependencies**: TASK-007
- **Parallelizable**: false

#### Description
CREATE comprehensive unit tests for data model classes in tests/unit/lib/ including validation, relationships, and business logic. WRITE failing tests for Scan model (FR-012): test scan creation, test scan validation (required fields, data types), test scan serialization to Firestore, test scan deserialization from Firestore, test relationship with User. CREATE tests/unit/lib/scan.model.test.ts. CONFIGURE Jest with React Native Testing Library. RUN tests. CONFIRM tests fail (RED). SHOW test count and coverage.

#### Requirements
- Model test files created in tests/unit/lib/
- Tests for Scan model: creation, validation, serialization, deserialization
- Tests for NutritionCard model
- Tests for AllergenInfo model
- Tests for AlternativeProduct model
- Tests fail initially (RED phase)
- Jest configured with React Native Testing Library
- Test file: scan.model.test.ts

#### Acceptance Criteria
- Model test files created with comprehensive coverage
- Validation tests included for all models
- Relationship tests covered (User → Scans)
- Serialization/deserialization tests included
- Tests fail as expected (RED phase)
- Test count visible
- Jest configuration working

#### Estimates
- **Duration**: 45min
- **Lines of Code**: 200-400

#### Verification
- **Type**: model_test_creation
- **Action**: SHOW
- **Commands**: 
  - `ls -la tests/unit/lib/`
  - `find tests/unit/lib -name "*.test.ts" | wc -l`
  - `npm test -- tests/unit/lib --listTests 2>&1 | head -20`
  - `npm test -- tests/unit/lib --coverage --coverageThreshold='{"global":{"branches":0,"functions":0,"lines":0,"statements":0}}' 2>&1 | tail -40`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: Model tests created and failing as expected. MANDATORY: All requirements from description must be verified. Tests must be in RED state (failing).
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output_and_files
  - Must Include: ["test files", "model tests", "test cases", "failing tests", "RED", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-008 verification complete! Proceed immediately to TASK-009 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-008 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-009!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-009

---

### TASK-009 [TASK-009] CREATE Integration Tests & SHOW Coverage

#### Task Details
- **TDD Phase**: RED
- **Sub Phase**: Test_Creation
- **Dependencies**: TASK-008
- **Parallelizable**: false

#### Description
CREATE integration tests in tests/integration/ that verify Firebase operations, API interactions, and system integration using real Firebase services. CONFIGURE Firebase Emulator Suite for local testing. WRITE failing integration tests for Firebase Auth (FR-011): test user registration, test user login, test token refresh, test logout. WRITE failing tests for Firestore: test scan creation, test scan retrieval, test scan deletion. WRITE failing tests for Firebase Storage: test image upload, test image retrieval. RUN tests against Firebase Emulator. CONFIRM tests fail (RED). SHOW test coverage and integration scenarios.

#### Requirements
- Integration test files created in tests/integration/
- Firebase Emulator Suite configured
- Tests for Firebase Auth: registration, login, token refresh, logout
- Tests for Firestore: scan creation, retrieval, deletion
- Tests for Firebase Storage: image upload, retrieval
- Tests use real Firebase Emulator (not mocks)
- Tests fail initially (RED phase)
- Test files: auth.integration.test.ts, scan.integration.test.ts, storage.integration.test.ts

#### Acceptance Criteria
- Integration test files created with comprehensive scenarios
- Database operations tested (Firestore CRUD)
- API interactions covered (Firebase Auth flows)
- Firebase Storage operations tested
- Tests fail as expected (RED phase)
- Firebase Emulator configured and running
- Test coverage visible

#### Estimates
- **Duration**: 50min
- **Lines of Code**: 200-400

#### Verification
- **Type**: integration_test_creation
- **Action**: SHOW
- **Commands**: 
  - `ls -la tests/integration/`
  - `find tests/integration -name "*.test.ts" | wc -l`
  - `firebase emulators:exec "echo 'Emulator configured'" 2>&1 | head -10 || echo "Emulator not running"`
  - `npm test -- tests/integration --listTests 2>&1 | head -20`
  - `npm test -- tests/integration 2>&1 | tail -40`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: Integration tests created and failing as expected. MANDATORY: All requirements from description must be verified. Tests must be in RED state (failing). Firebase Emulator must be configured.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output_and_files
  - Must Include: ["test files", "integration tests", "test scenarios", "failing tests", "RED", "firebase emulator", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-009 verification complete! Proceed immediately to TASK-010 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-009 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-010!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-010

---

### TASK-010 [TASK-010] IMPLEMENT Data Models & CONFIRM GREEN

#### Task Details
- **TDD Phase**: GREEN
- **Sub Phase**: Implementation
- **Dependencies**: TASK-009
- **Parallelizable**: false

#### Description
IMPLEMENT data model classes (Scan, NutritionCard, AllergenInfo, AlternativeProduct) with proper validation, relationships, and business logic to make model tests pass. CREATE src/lib/scan/scan.model.ts with Scan entity matching Firestore schema, validation methods, serialization/deserialization. CREATE src/lib/nutrition/nutrition.model.ts, src/lib/allergen/allergen.model.ts, src/lib/alternatives/alternatives.model.ts. IMPLEMENT all validation logic, Firestore conversion methods. ADD FR-XXX traceability comments. RUN unit tests from TASK-008. CONFIRM all tests are GREEN (passing). SHOW passing test output and ≥85% coverage.

#### Requirements
- Scan model implemented with all fields matching Firestore schema
- NutritionCard model implemented
- AllergenInfo model implemented
- AlternativeProduct model implemented
- Validation methods implemented for all models
- Firestore serialization/deserialization implemented
- FR-XXX comments added (FR-012 for Scan model)
- All model tests pass (GREEN)
- Test coverage ≥85%

#### Acceptance Criteria
- Data models implemented with all functionality
- Validation working for all models
- Relationships established (User → Scans)
- All model tests pass (GREEN)
- Test coverage ≥85%
- Models match Firestore schema

#### Estimates
- **Duration**: 60min
- **Lines of Code**: 400-600

#### Verification
- **Type**: model_implementation_verification
- **Action**: CONFIRM
- **Commands**: 
  - `npm test -- tests/unit/lib --coverage --coverageThreshold='{"global":{"branches":85,"functions":85,"lines":85,"statements":85}}' 2>&1 | tail -50`
  - `grep -r "✓" tests/unit/lib 2>/dev/null || npm test -- tests/unit/lib 2>&1 | grep -E "(PASS|✓|passing)"`
  - `npx tsc --noEmit`
  - `grep -r "FR-012" src/lib --include="*.ts" | head -5`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: All model tests pass with GREEN status. MANDATORY: All requirements from description must be verified. Test coverage must be ≥85%.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output
  - Must Include: ["GREEN", "passing", "models", "validation", "≥85%", "coverage", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-010 verification complete! Proceed immediately to TASK-011 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-010 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-011!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-011

---

### TASK-011 [TASK-011] IMPLEMENT Firebase Auth Service & CONFIRM GREEN

#### Task Details
- **TDD Phase**: GREEN
- **Sub Phase**: Implementation
- **Dependencies**: TASK-010
- **Parallelizable**: false

#### Description
IMPLEMENT Firebase Authentication service with Firebase Auth integration to make integration tests pass. CREATE src/lib/auth/auth.service.ts with Firebase Auth integration using @react-native-firebase/auth. IMPLEMENT register method (email/password, FR-011), login method, logout method, refreshToken method, getCurrentUser method. IMPLEMENT error handling and user session management. ADD FR-XXX traceability comments (FR-011). RUN integration tests from TASK-009. CONFIRM all tests are GREEN (passing). SHOW passing test output.

#### Requirements
- Firebase Auth service created (src/lib/auth/auth.service.ts)
- Register method implemented (email/password authentication)
- Login method implemented
- Logout method implemented
- RefreshToken method implemented
- GetCurrentUser method implemented
- Error handling implemented
- FR-011 comments added
- All integration tests pass (GREEN)
- Uses real Firebase Auth (integration-first)

#### Acceptance Criteria
- Firebase Auth service implemented with all methods
- Connection management working
- Authentication operations functional
- All integration tests pass (GREEN)
- Real Firebase Auth used (not mocks)
- Error handling robust

#### Estimates
- **Duration**: 60min
- **Lines of Code**: 300-500

#### Verification
- **Type**: database_implementation_verification
- **Action**: CONFIRM
- **Commands**: 
  - `npm test -- tests/integration/auth.integration.test.ts 2>&1 | tail -40`
  - `grep -r "FR-011" src/lib/auth --include="*.ts" | head -5`
  - `cat src/lib/auth/auth.service.ts | head -50`
  - `firebase emulators:exec "npm test -- tests/integration/auth.integration.test.ts" 2>&1 | tail -30 || npm test -- tests/integration/auth.integration.test.ts 2>&1 | tail -30`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: All integration tests pass with GREEN status. MANDATORY: All requirements from description must be verified. Tests must use real Firebase Auth.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output
  - Must Include: ["GREEN", "passing", "firebase auth", "integration tests", "authentication", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-011 verification complete! Proceed immediately to TASK-012 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-011 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-012!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-012

---

### TASK-012 [TASK-012] IMPLEMENT Basic App Structure & CONFIRM GREEN

#### Task Details
- **TDD Phase**: GREEN
- **Sub Phase**: Implementation
- **Dependencies**: TASK-011
- **Parallelizable**: false

#### Description
IMPLEMENT basic React Native Expo app structure with navigation setup. CREATE app/_layout.tsx with Expo Router root layout and navigation configuration. CREATE app/(tabs)/index.tsx placeholder screen for scan functionality. CREATE app/(auth)/login.tsx and app/(auth)/register.tsx placeholder screens. INSTALL React Navigation dependencies if using React Navigation. CONFIGURE bottom tab navigation structure. RUN app with `npx expo start`. CONFIRM app starts successfully and navigation works. SHOW app running in simulator/device.

#### Requirements
- Root layout created (app/_layout.tsx)
- Tab navigation structure created (app/(tabs)/)
- Scan screen placeholder created (app/(tabs)/index.tsx)
- Auth screens created (app/(auth)/login.tsx, register.tsx)
- Navigation configured (Expo Router or React Navigation)
- App starts successfully
- Navigation works between screens

#### Acceptance Criteria
- Basic app structure implemented
- Navigation configured and working
- App starts successfully
- Screens render correctly
- Navigation flows functional
- App runs in simulator/device

#### Estimates
- **Duration**: 45min
- **Lines of Code**: 200-400

#### Verification
- **Type**: api_implementation_verification
- **Action**: CONFIRM
- **Commands**: 
  - `npx expo start --web 2>&1 | head -30 || npx expo start 2>&1 | head -30`
  - `ls -la app/_layout.tsx app/(tabs)/index.tsx app/(auth)/login.tsx`
  - `npx tsc --noEmit`
  - `cat app/_layout.tsx | head -30`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: App structure implemented and app starts successfully. MANDATORY: All requirements from description must be verified. App must run without errors.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output
  - Must Include: ["GREEN", "app starts", "navigation", "expo", "screens", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-012 verification complete! Proceed immediately to TASK-013 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-012 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-013!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-013

---

### TASK-013 [TASK-013] REFACTOR Architecture & CONFIRM Boundaries

#### Task Details
- **TDD Phase**: REFACTOR
- **Sub Phase**: Architectural_Review
- **Dependencies**: TASK-012
- **Parallelizable**: false

#### Description
REFACTOR system architecture WITHOUT changing external behavior. REVIEW Scan model implementation. ENSURE single domain model compliance (no DTOs, direct Firestore document mapping). VERIFY direct Firestore document mapping. CHECK FR-XXX traceability comments are present. EXTRACT duplicate code. IMPROVE module separation. SIMPLIFY complex methods. ENSURE clean interfaces. ALL existing tests must continue to pass. CONFIRM architectural boundaries are respected and code is more maintainable.

#### Requirements
- Architecture reviewed for all implemented modules
- Single domain model compliance verified (no DTOs)
- Direct Firestore mapping verified
- FR-XXX traceability comments checked
- Duplicate code extracted
- Module separation improved
- Complex methods simplified
- All tests still pass
- No external behavior changes

#### Acceptance Criteria
- Code structure improved
- No external behavior changes
- All tests still pass
- Architectural boundaries clear
- Code more maintainable
- Single domain model compliance verified

#### Estimates
- **Duration**: 45min
- **Lines of Code**: 200-400

#### Verification
- **Type**: refactoring_verification
- **Action**: REFACTOR
- **Commands**: 
  - `npm test 2>&1 | tail -30`
  - `grep -r "DTO\|Repository\|UnitOfWork" src/lib --include="*.ts" | wc -l`
  - `grep -r "FR-" src/lib --include="*.ts" | wc -l`
  - `npx tsc --noEmit`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: All tests pass, code structure improved, no behavior changes. MANDATORY: All requirements from description must be verified. No DTOs or unnecessary abstractions found.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output_and_code_comparison
  - Must Include: ["all tests passing", "before/after code", "no new features", "improved structure", "single domain model", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-013 verification complete! Proceed immediately to TASK-014 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-013 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-014!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-014

---

### TASK-014 [TASK-014] REFACTOR Code Quality & CONFIRM Standards

#### Task Details
- **TDD Phase**: REFACTOR
- **Sub Phase**: Code_Quality_Review
- **Dependencies**: TASK-013
- **Parallelizable**: false

#### Description
REFACTOR code quality WITHOUT changing functionality. FOCUS on: renaming variables for clarity, extracting long methods, removing code duplication, improving readability, applying consistent naming conventions. RUN ESLint and Prettier. FIX all linting errors. ENSURE consistent code style. VERIFY TypeScript strict mode compliance. ALL existing tests must continue to pass. CONFIRM code follows best practices and is more readable.

#### Requirements
- ESLint configured and run
- Prettier configured and run
- All linting errors fixed
- Consistent code style applied
- Variable names improved for clarity
- Long methods extracted
- Code duplication removed
- TypeScript strict mode compliant
- All tests still pass
- No functionality changes

#### Acceptance Criteria
- Code quality improved
- Naming conventions applied
- Readability enhanced
- All tests still pass
- No functionality changes
- 0 linting errors
- Consistent code style

#### Estimates
- **Duration**: 30min
- **Lines of Code**: 150-300

#### Verification
- **Type**: code_quality_refactoring
- **Action**: REFACTOR
- **Commands**: 
  - `npm test 2>&1 | tail -20`
  - `npx eslint src --ext .ts,.tsx 2>&1 | tail -30`
  - `npx prettier --check src 2>&1 | tail -20 || echo "Prettier not configured"`
  - `npx tsc --noEmit --strict`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: All tests pass, code quality improved, no behavior changes. MANDATORY: All requirements from description must be verified. 0 linting errors.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output_and_code_comparison
  - Must Include: ["all tests passing", "improved naming", "extracted methods", "removed duplication", "consistent style", "0 errors", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-014 verification complete! Proceed immediately to TASK-015 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-014 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-015!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-015

---

### TASK-015 [TASK-015] REFACTOR Error Handling & CONFIRM Robustness

#### Task Details
- **TDD Phase**: REFACTOR
- **Sub Phase**: Error_Handling_Review
- **Dependencies**: TASK-014
- **Parallelizable**: false

#### Description
REFACTOR error handling WITHOUT changing external behavior. FOCUS on: consolidating duplicate error handling, improving error messages, standardizing error responses, ensuring consistent error logging. CREATE src/lib/api/error-handler.ts for centralized error handling. IMPLEMENT consistent error response format. IMPLEMENT error logging. ALL existing tests must continue to pass. CONFIRM error handling is more robust and maintainable.

#### Requirements
- Centralized error handler created (src/lib/api/error-handler.ts)
- Duplicate error handling consolidated
- Error messages improved
- Error responses standardized
- Error logging consistent
- All tests still pass
- No behavior changes
- FR-019 comments added

#### Acceptance Criteria
- Error handling improved
- Error messages standardized
- Logging consistent
- All tests still pass
- No behavior changes
- Centralized error handling

#### Estimates
- **Duration**: 30min
- **Lines of Code**: 100-200

#### Verification
- **Type**: error_handling_refactoring
- **Action**: REFACTOR
- **Commands**: 
  - `npm test 2>&1 | tail -20`
  - `cat src/lib/api/error-handler.ts | head -50`
  - `grep -r "FR-019" src/lib --include="*.ts" | head -5`
  - `grep -r "throw new Error\|catch\|error" src/lib --include="*.ts" | wc -l`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: All tests pass, error handling improved, no behavior changes. MANDATORY: All requirements from description must be verified. Error handling must be centralized.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output_and_code_comparison
  - Must Include: ["all tests passing", "consolidated error handling", "improved error messages", "standardized responses", "consistent logging", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-015 verification complete! Proceed immediately to TASK-016 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-015 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-016!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-016

---

### TASK-016 [TASK-016] COMPILE Code & SHOW 0 Errors

#### Task Details
- **TDD Phase**: SMOKE
- **Sub Phase**: Compilation_Check
- **Dependencies**: TASK-015
- **Parallelizable**: false

#### Description
COMPILE entire React Native Expo codebase using TypeScript compiler and SHOW compilation results with 0 errors. VERIFY all modules compile successfully. VERIFY all dependencies are resolved. VERIFY no TypeScript errors. VERIFY no import errors. CONFIRM compilation is clean.

#### Requirements
- TypeScript compilation successful
- 0 compilation errors
- All dependencies resolved
- No import errors
- No type errors
- Compilation clean

#### Acceptance Criteria
- Code compiles successfully
- 0 errors
- All dependencies resolved
- Compilation clean
- TypeScript strict mode compliant

#### Estimates
- **Duration**: 10min
- **Lines of Code**: 0-10

#### Verification
- **Type**: compilation_verification
- **Action**: SHOW
- **Commands**: 
  - `npx tsc --noEmit 2>&1 | tail -30`
  - `npx expo start --no-dev --minify 2>&1 | head -30 || echo "Build check"`
  - `npm run build 2>&1 | tail -30 || echo "No build script"`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: Code compiles successfully with 0 errors. MANDATORY: All requirements from description must be verified. TypeScript compilation must show 0 errors.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output
  - Must Include: ["compilation", "successful", "0 errors", "dependencies", "resolved", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-016 verification complete! Proceed immediately to TASK-017 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-016 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-017!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-017

---

### TASK-017 [TASK-017] EXECUTE All Tests & SHOW GREEN Status

#### Task Details
- **TDD Phase**: SMOKE
- **Sub Phase**: Test_Execution
- **Dependencies**: TASK-016
- **Parallelizable**: false

#### Description
EXECUTE complete test suite including contract tests, model tests, and integration tests. RUN all test suites: `npm test`. SHOW all tests pass with GREEN status. VERIFY ≥85% code coverage across all modules. MANDATORY: You must actually run the test commands (npm test) and show the terminal output - creating test files is NOT sufficient.

#### Requirements
- All test suites executed (contract, model, integration)
- All tests pass (GREEN status)
- Test coverage ≥85% achieved
- Test results shown in terminal output
- All test types verified

#### Acceptance Criteria
- All tests executed
- All tests pass
- GREEN status confirmed
- ≥85% coverage achieved
- Test results visible in terminal

#### Estimates
- **Duration**: 15min
- **Lines of Code**: 0-10

#### Verification
- **Type**: comprehensive_test_execution
- **Action**: EXECUTE
- **Commands**: 
  - `npm test -- --coverage --coverageThreshold='{"global":{"branches":85,"functions":85,"lines":85,"statements":85}}' 2>&1 | tail -50`
  - `npm test 2>&1 | grep -E "(PASS|FAIL|Tests:)" | tail -10`
  - `npm test 2>&1 | tail -30`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: All test suites pass with GREEN status. MANDATORY: All requirements from description must be verified. Coverage must be ≥85%.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output
  - Must Include: ["passing", "GREEN", "0 failed", "85% coverage", "≥85%", "test results", "terminal output", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-017 verification complete! Proceed immediately to TASK-018 without stopping or asking for permission!
- On Failure: 🚨 CRITICAL: TASK-017 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify, then proceed immediately to TASK-018!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-018

---

### TASK-018 [TASK-018] EXECUTE Phase 1 Smoke Test & SHOW System Operational

#### Task Details
- **TDD Phase**: SMOKE
- **Sub Phase**: System_Verification
- **Dependencies**: TASK-017
- **Parallelizable**: false

#### Description
EXECUTE comprehensive smoke test of Phase 1 functionality including: project structure verified AND Firebase connection tested AND Firestore schema validated AND authentication flow tested AND all tests passing AND app starts successfully. VERIFY project structure matches specification. VERIFY Firebase connection works. VERIFY Firestore collections accessible. VERIFY authentication initializes. VERIFY app builds and starts. SHOW system is operational and ready for Phase 2. MANDATORY: Test ALL components created in Phase 1 - do not skip any!

#### Requirements
- Project structure matches specification
- Firebase connection verified
- Firestore schema validated
- Authentication flow tested
- All tests passing
- App starts successfully
- System operational
- Ready for Phase 2

#### Acceptance Criteria
- Smoke test executed with ALL components tested
- System operational
- ALL components working
- ALL database operations functional
- Integration confirmed
- Ready for Phase 2
- Verify ALL 6 requirements before marking complete!

#### Estimates
- **Duration**: 20min
- **Lines of Code**: 50-100

#### Verification
- **Type**: phase_smoke_test_execution
- **Action**: EXECUTE
- **Commands**: 
  - `npm test 2>&1 | tail -20`
  - `npx expo start 2>&1 | head -20`
  - `firebase emulators:exec "echo 'Firebase operational'" 2>&1 | head -10 || echo "Firebase check"`
  - `npx tsc --noEmit`
  - `CRITICAL: Verify ALL requirements from description are implemented`
- **Expected State**: Phase 1 smoke test passes, system operational. MANDATORY: All requirements from description must be verified. All Phase 1 components must be tested.
- **Mandatory**: true
- **Proof Required**: 
  - Format: terminal_output
  - Must Include: ["smoke test", "operational", "firebase", "firestore", "authentication", "app starts", "system", "VERIFIED: All requirements implemented"]

**Post-Verification Instructions**:
- On Success: 🚨 CRITICAL: TASK-018 verification complete! Phase 1 complete! Ready for Phase 2 implementation!
- On Failure: 🚨 CRITICAL: TASK-018 verification failed! ALL requirements from description must be implemented. Fix ALL missing requirements and re-verify!
- Enforcement: mandatory
- No Pause: true
- Next Task: TASK-019 (Phase 2)

---

## 📊 Phase 1 Summary

**Status**: in_progress
**Tasks Completed**: 0/18
**Next Phase**: Phase 2 - Core Implementation (TASK-019 to TASK-036)

**Key Deliverables**:
- ✅ Project structure configured
- ✅ Development environment setup
- ✅ Firebase project initialized
- ✅ OpenAPI specification created
- ✅ Firestore schema defined
- ✅ Data models implemented
- ✅ Tests written and passing
- ✅ Basic app structure implemented

**Ready for Phase 2**: Core business logic implementation

