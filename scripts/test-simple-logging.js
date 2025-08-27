#!/usr/bin/env node

/**
 * Simple test script to verify console logging is working
 */

console.log('🔍 ===== SIMPLE LOGGING TEST =====');
console.log('🔍 If you can see this, console logging is working!');
console.log('🔍 Current time:', new Date().toISOString());
console.log('🔍 Node.js version:', process.version);
console.log('🔍 Current working directory:', process.cwd());
console.log('');

console.log('🔍 Testing different log levels:');
console.log('🔍 Regular log message');
console.warn('🔍 Warning message');
console.error('🔍 Error message');
console.log('');

console.log('🔍 ===== LOGGING TEST COMPLETED =====');
console.log('🔍 If you saw all the messages above, logging is working correctly!');
console.log('🔍 The issue might be that the Next.js server needs to be restarted');
console.log('🔍 Or the ImageProcessingService is not being called');
console.log('🔍 Try restarting your dev server: npm run dev');
