// Temporary bridge to pure DDD API Gateway
// This file maintains backward compatibility during the transition period
// All business logic now resides in the proper DDD structure under domains/
// The API Gateway serves as the main entry point for the application
import '../interfaces/api-gateway/src/index.js';

console.log('🏗️  FlowCreate Pure DDD Architecture');
console.log('📁 Domain Layer: domains/');
console.log('⚙️  Application Services: services/');
console.log('🔧 Infrastructure: infrastructure/');
console.log('🌐 API Gateway: interfaces/api-gateway/');
console.log('✅ Architecture transition complete');