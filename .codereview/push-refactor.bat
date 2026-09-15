@echo off
REM Push baseline (main) + refactor branch from the bundle to GitHub Tuong1308/Portfolio
setlocal
set BUNDLE=%~dp0portfolio-refactor.bundle
set WORK=%TEMP%\Portfolio-push

if exist "%WORK%" rmdir /s /q "%WORK%"
git clone "%BUNDLE%" "%WORK%" || goto :fail
cd /d "%WORK%"
git remote set-url origin https://github.com/Tuong1308/Portfolio.git || goto :fail
git push origin refs/remotes/origin/main:refs/heads/main refs/remotes/origin/refactor/clean-code-2026-09-15:refs/heads/refactor/clean-code-2026-09-15 || goto :fail

echo.
echo Done. Open the PR:
echo https://github.com/Tuong1308/Portfolio/compare/main...refactor/clean-code-2026-09-15
start "" "https://github.com/Tuong1308/Portfolio/compare/main...refactor/clean-code-2026-09-15"
pause
exit /b 0

:fail
echo.
echo Push failed - check that git is installed and you are signed in to GitHub with write access.
pause
exit /b 1
