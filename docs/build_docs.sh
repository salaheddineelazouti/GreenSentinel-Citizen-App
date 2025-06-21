#!/bin/bash
# GreenSentinel Documentation Builder
# Converts Markdown files to PDF using pandoc
# Usage: ./build_docs.sh

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directory structure
BASE_DIR="$(dirname "$(readlink -f "$0")")"
BUILD_DIR="${BASE_DIR}/build"
GUIDES_DIR="${BASE_DIR}/user-guide"
PRIVACY_DIR="${BASE_DIR}/privacy"

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo -e "${YELLOW}Pandoc not found. PDF generation will be skipped.${NC}"
    echo -e "${YELLOW}To install pandoc, visit: https://pandoc.org/installing.html${NC}"
    exit 0
fi

# Create build directory structure if it doesn't exist
mkdir -p "${BUILD_DIR}/user-guide"
mkdir -p "${BUILD_DIR}/privacy"

echo -e "${GREEN}Converting Markdown files to PDF...${NC}"

# Process user guide documents
for file in "${GUIDES_DIR}"/*.md; do
    if [ -f "$file" ]; then
        filename=$(basename -- "$file")
        name="${filename%.*}"
        echo "Processing $filename..."
        pandoc "$file" -o "${BUILD_DIR}/user-guide/${name}.pdf" \
            --pdf-engine=wkhtmltopdf \
            --variable=margin-top:20 \
            --variable=margin-right:20 \
            --variable=margin-bottom:20 \
            --variable=margin-left:20 \
            --variable=colorlinks:true
    fi
done

# Process privacy documents
for file in "${PRIVACY_DIR}"/*.md; do
    if [ -f "$file" ]; then
        filename=$(basename -- "$file")
        name="${filename%.*}"
        echo "Processing $filename..."
        pandoc "$file" -o "${BUILD_DIR}/privacy/${name}.pdf" \
            --pdf-engine=wkhtmltopdf \
            --variable=margin-top:20 \
            --variable=margin-right:20 \
            --variable=margin-bottom:20 \
            --variable=margin-left:20 \
            --variable=colorlinks:true
    fi
done

echo -e "${GREEN}Documentation generation complete!${NC}"
echo -e "PDFs available in: ${BUILD_DIR}"
