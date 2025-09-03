#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and capture result
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_success="$3" # true/false
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    echo "Command: $command"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Run command and capture output and exit code
    output=$(eval "$command" 2>&1)
    exit_code=$?
    
    # Determine if test passed
    if [[ "$expected_success" == "true" && $exit_code -eq 0 ]] || [[ "$expected_success" == "false" && $exit_code -ne 0 ]]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo -e "${RED}Exit code: $exit_code${NC}"
        echo -e "${RED}Output: $output${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo "----------------------------------------"
}

echo -e "${YELLOW}🧪 Starting i18n-help Comprehensive Tests${NC}"
echo "=========================================="

# Test 1: i18n Format Tests
echo -e "\n${YELLOW}📁 Testing i18n Format (flat files)${NC}"
cd "$(dirname "$0")/i18n-format" || exit 1

run_test "Find key: login" "i18nHelp find login key" "true"
run_test "Find key: button" "i18nHelp find button key" "true"
run_test "Find value: Hello" "i18nHelp find Hello value" "true"
run_test "Find value in Turkish" "i18nHelp find Merhaba value tr" "true"
run_test "Find both: hello" "i18nHelp find hello both" "true"
run_test "Find non-existent" "i18nHelp find nonexistent key" "true"

# Add tests
run_test "Add new key" "i18nHelp add testKey 'Test Value'" "true"
run_test "Add with overwrite" "i18nHelp add testKey 'Updated Value' --overwrite" "true"
run_test "Add with locale" "i18nHelp add manualKey 'Manual Value' --locale tr='Manuel Değer'" "true"
run_test "Add invalid case (should fail)" "i18nHelp add test_invalid 'Invalid Case'" "false"
run_test "Add invalid case with auto-fix" "i18nHelp add test_invalid 'Fixed Case' --auto-fix" "true"
run_test "Add with skip validation" "i18nHelp add INVALID_KEY 'Skip Validation' --skip-validation" "true"

# Delete tests
run_test "Delete existing key" "i18nHelp delete testKey" "true"
run_test "Delete non-existent key" "i18nHelp delete nonExistentKey" "true"

# Test 2: intl Format Tests
echo -e "\n${YELLOW}📁 Testing intl Format (nested files)${NC}"
cd "../intl-format" || exit 1

run_test "Find nested key: navigation" "i18nHelp find navigation key" "true"
run_test "Find nested key: form" "i18nHelp find form key" "true"
run_test "Find nested value: Home" "i18nHelp find Home value" "true"
run_test "Find nested value in Turkish" "i18nHelp find 'Ana Sayfa' value tr" "true"
run_test "Find nested both: contact" "i18nHelp find contact both" "true"

# Add nested tests
run_test "Add flat key" "i18nHelp add newFeature 'New Feature'" "true"
run_test "Add nested key" "i18nHelp add settings.theme 'Theme Settings'" "true"
run_test "Add deep nested key" "i18nHelp add user.profile.name 'Profile Name'" "true"
run_test "Add existing with overwrite" "i18nHelp add newFeature 'Updated Feature' --overwrite" "true"

# Nested delete tests
run_test "Delete flat key" "i18nHelp delete newFeature" "true"
run_test "Delete nested key" "i18nHelp delete settings.theme" "true"
run_test "Delete deep nested key" "i18nHelp delete user.profile.name" "true"

# Test 3: Edge Cases
echo -e "\n${YELLOW}🔍 Testing Edge Cases${NC}"

run_test "Empty value" "i18nHelp add emptyTest ''" "true"
run_test "Special characters" "i18nHelp add specialChars 'üöğışç çümlə'" "true"
run_test "Long key name" "i18nHelp add veryLongKeyNameThatShouldStillWorkProperly 'Long key test'" "true"

# Test 4: Create test source files for unused command
echo -e "\n${YELLOW}📂 Testing unused command${NC}"
mkdir -p ../src 2>/dev/null
echo 'const text = t("hello")' > ../src/component.tsx
echo 'const label = t("loginButton")' > ../src/form.tsx

cd ../i18n-format
run_test "Unused keys i18n" "i18nHelp unused ../src" "true"

cd ../intl-format
run_test "Unused keys intl" "i18nHelp unused ../src" "true"

# Cleanup test files
rm -rf ../src

# Test Summary
echo -e "\n${YELLOW}📊 Test Summary${NC}"
echo "=========================================="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}💥 Some tests failed!${NC}"
    exit 1
fi