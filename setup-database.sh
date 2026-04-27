#!/bin/bash

# Database Setup Script for Sports & Nutrition Tracker
# This script helps automate the database setup process

echo "🏋️ Sports & Nutrition Tracker - Database Setup"
echo "=============================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL first: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL found"
echo ""

# Prompt for database credentials
read -p "Enter PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -p "Enter database name (default: sports_tracker): " DB_NAME
DB_NAME=${DB_NAME:-sports_tracker}

echo ""
echo "Creating database '$DB_NAME'..."

# Create database
psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
else
    echo "⚠️  Database might already exist, continuing..."
fi

echo ""
echo "Setting up database schema..."

# Run schema file
psql -U "$DB_USER" -d "$DB_NAME" -f database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully"
    echo ""
    echo "🎉 Database setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Copy .env.example to .env"
    echo "2. Update .env with your database credentials and OpenAI API key"
    echo "3. Run 'npm install' to install dependencies"
    echo "4. Run 'npm start' to start the server"
else
    echo "❌ Error setting up database schema"
    exit 1
fi
