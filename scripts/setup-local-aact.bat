@echo off
REM Script to download and restore AACT database locally on Windows
REM This provides the fastest possible queries by running the database on your machine

echo ========================================
echo AACT Local Database Setup Script (Windows)
echo ========================================
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PostgreSQL is not installed or not in PATH!
    echo Please install PostgreSQL first from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo PostgreSQL is installed
echo.

REM Configuration
set DB_NAME=aact_local
set DB_USER=postgres
set DOWNLOAD_URL=https://aact.ctti-clinicaltrials.org/static/static_db_copies/daily/aact_daily.dumpfile
set DUMP_FILE=aact_daily.dumpfile

echo Configuration:
echo   Database Name: %DB_NAME%
echo   Database User: %DB_USER%
echo   Download URL: %DOWNLOAD_URL%
echo.

REM Step 1: Download the database dump
echo Step 1: Downloading AACT database dump...
echo WARNING: This file is ~15GB and may take 30-60 minutes to download
set /p CONTINUE="Continue? (y/n): "
if /i not "%CONTINUE%"=="y" (
    echo Download cancelled
    exit /b 1
)

if exist "%DUMP_FILE%" (
    echo Dump file already exists, skipping download
) else (
    echo Downloading... (this will take a while)
    curl -o "%DUMP_FILE%" "%DOWNLOAD_URL%"
    
    if %ERRORLEVEL% NEQ 0 (
        echo Download failed!
        pause
        exit /b 1
    )
    echo Download complete!
)
echo.

REM Step 2: Create database
echo Step 2: Creating local database...
psql -U %DB_USER% -c "DROP DATABASE IF EXISTS %DB_NAME%;"
psql -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;"

if %ERRORLEVEL% NEQ 0 (
    echo Failed to create database!
    echo Make sure PostgreSQL is running and you have the correct permissions
    pause
    exit /b 1
)
echo Database created!
echo.

REM Step 3: Restore database
echo Step 3: Restoring database from dump...
echo This will take 10-20 minutes...
pg_restore -U %DB_USER% -d %DB_NAME% -c "%DUMP_FILE%"

echo Database restored!
echo.

REM Step 4: Verify installation
echo Step 4: Verifying installation...
for /f %%i in ('psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM studies;"') do set STUDY_COUNT=%%i

if defined STUDY_COUNT (
    echo Verification successful!
    echo Total studies in database: %STUDY_COUNT%
) else (
    echo Verification failed!
    pause
    exit /b 1
)
echo.

REM Step 5: Update .env file
echo Step 5: Update your .env file with these lines:
echo.
echo # Local AACT Database
echo AACT_LOCAL=true
echo AACT_LOCAL_HOST=localhost
echo AACT_LOCAL_PORT=5432
echo AACT_LOCAL_DATABASE=%DB_NAME%
echo AACT_LOCAL_USER=%DB_USER%
echo AACT_LOCAL_PASSWORD=your_postgres_password
echo.

REM Cleanup option
set /p CLEANUP="Delete the dump file to save space? (y/n): "
if /i "%CLEANUP%"=="y" (
    del "%DUMP_FILE%"
    echo Dump file deleted
)

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Update your .env file with the configuration above
echo 2. Restart your application
echo 3. Enjoy lightning-fast clinical trial queries!
echo.
echo Tip: Run this script weekly to keep your local database up-to-date
echo.
pause
