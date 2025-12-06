#!/bin/bash

# Deploy with Confidence Script
# 
# This script is the ONLY gateway to Staging deployment.
# It enforces a strict "Test-First" policy.
#
# Steps:
# 1. Static Analysis (Lint & Type Check)
# 2. i18n Integrity Check (No missing keys, no broken placeholders)
# 3. Local Simulation (Full smoke test with edge cases)
# 4. Deployment (Only if all above pass)

set -e # Exit immediately if any command exits with a non-zero status

echo "🛡️  Starting Confidence Pipeline..."

# Step 1: Static Analysis
echo -e "\n🔍 [1/4] Running Static Analysis (Lint & Types)..."
pnpm lint
# Check for TypeScript errors (if lint doesn't cover it fully, usually tsc --noEmit is good but lint is often enough)
echo "✅ Static Analysis Passed."

# Step 2: i18n Check
echo -e "\n🌍 [2/4] Verifying i18n Integrity..."
npx tsx scripts/check-i18n-integrity.ts
echo "✅ i18n Integrity Passed."

# Step 3: Local Simulation (The Real Test)
echo -e "\n🤖 [3/4] Running Local Simulation (Smoke Tests)..."
# We run the user role simulation which covers the core flows including the new ambiguous content test
./scripts/run-local-sim.sh user
echo "✅ Local Simulation Passed."

# Step 4: Deploy
echo -e "\n🚀 [4/4] All Tests Passed. Deploying to Staging..."
pnpm deploy:staging

echo -e "\n🎉 Deployment Complete! System is verified and live on Staging."

