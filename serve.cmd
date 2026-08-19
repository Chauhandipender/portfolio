@echo off
REM Preview the portfolio locally over http, so the bundled game builds work.
REM Opening index.html directly uses file://, where browsers block fetch().
start "" http://localhost:8080/
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\serve.ps1"
