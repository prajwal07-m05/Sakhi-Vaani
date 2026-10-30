@echo off
setlocal
cd /d "%~dp0"
if not exist "node_modules" (
  echo [ERROR] Test tools are missing. Run setup.bat first.
  exit /b 1
)
echo Running SAKHI VANI automated tests (core, eligibility, calling, backend HTTP)...
call npm test
if errorlevel 1 (
  echo [FAIL] Some tests failed - see output above.
  exit /b 1
)
echo [PASS] All tests passed.
