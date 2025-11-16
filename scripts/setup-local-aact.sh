#!/bin/bash

# Script to download and restore AACT database locally
# This provides the fastest possible queries by running the database on your machine

echo "🚀 AACT Local Database Setup Script"
echo "===================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo "Please install PostgreSQL first:"
    echo "  - macOS: brew install postgresql"
    echo "  - Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    echo "  - Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

echo "✅ PostgreSQL is installed"
echo ""

# Configuration
DB_NAME="aact_local"
DB_USER="postgres"
DOWNLOAD_URL="https://aact.ctti-clinicaltrials.org/static/static_db_copies/daily/aact_daily.dumpfile"
DUMP_FILE="aact_daily.dumpfile"

echo "📋 Configuration:"
echo "  Database Name: $DB_NAME"
echo "  Database User: $DB_USER"
echo "  Download URL: $DOWNLOAD_URL"
echo ""

# Step 1: Download the database dump
echo "📥 Step 1: Downloading AACT database dump..."
echo "⚠️  Warning: This file is ~15GB and may take 30-60 minutes to download"
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Download cancelled"
    exit 1
fi

if [ -f "$DUMP_FILE" ]; then
    echo "✅ Dump file already exists, skipping download"
else
    echo "⏳ Downloading... (this will take a while)"
    curl -o "$DUMP_FILE" "$DOWNLOAD_URL"
    
    if [ $? -ne 0 ]; then
        echo "❌ Download failed!"
        exit 1
    fi
    echo "✅ Download complete!"
fi
echo ""

# Step 2: Create database
echo "🗄️  Step 2: Creating local database..."
psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

if [ $? -ne 0 ]; then
    echo "❌ Failed to create database!"
    echo "Make sure PostgreSQL is running and you have the correct permissions"
    exit 1
fi
echo "✅ Database created!"
echo ""

# Step 3: Restore database
echo "📦 Step 3: Restoring database from dump..."
echo "⏳ This will take 10-20 minutes..."
pg_restore -U $DB_USER -d $DB_NAME -c "$DUMP_FILE"

if [ $? -ne 0 ]; then
    echo "⚠️  Restore completed with some warnings (this is normal)"
else
    echo "✅ Database restored successfully!"
fi
echo ""

# Step 4: Verify installation
echo "🔍 Step 4: Verifying installation..."
STUDY_COUNT=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM studies;")

if [ $? -eq 0 ]; then
    echo "✅ Verification successful!"
    echo "📊 Total studies in database: $STUDY_COUNT"
else
    echo "❌ Verification failed!"
    exit 1
fi
echo ""

# Step 5: Update .env file
echo "📝 Step 5: Updating .env file..."
echo ""
echo "Add these lines to your .env file:"
echo ""
echo "# Local AACT Database"
echo "AACT_LOCAL=true"
echo "AACT_LOCAL_HOST=localhost"
echo "AACT_LOCAL_PORT=5432"
echo "AACT_LOCAL_DATABASE=$DB_NAME"
echo "AACT_LOCAL_USER=$DB_USER"
echo "AACT_LOCAL_PASSWORD=your_postgres_password"
echo ""

# Cleanup option
read -p "Delete the dump file to save space? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm "$DUMP_FILE"
    echo "✅ Dump file deleted"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with the configuration above"
echo "2. Restart your application"
echo "3. Enjoy lightning-fast clinical trial queries!"
echo ""
echo "💡 Tip: Run this script weekly to keep your local database up-to-date"
