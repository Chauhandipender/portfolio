@echo off
REM Preview the portfolio locally over http, so the bundled game builds work.
REM Opening index.html directly runs on file://, where browsers block fetch()
REM and the games in games\ cannot load their assets.
REM
REM The server opens your browser itself once the port is actually listening.
title Portfolio local server
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\serve.ps1"
if errorlevel 1 pause
