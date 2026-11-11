@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   НОМЕРА - локальный сервер
echo   ------------------------------------------------
echo   На этом компьютере:  http://localhost:8000
echo   С телефона (та же Wi-Fi сеть): http://IP:8000
echo   IP-адрес этого компьютера:
ipconfig | findstr /i "IPv4"
echo.
echo   Чтобы остановить сервер - просто закройте это окно.
echo.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8000"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 -m http.server 8000
  goto :end
)
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8000
  goto :end
)
echo.
echo   Python не найден.
echo   Установите Python 3 с https://www.python.org/downloads/
echo   (отметьте "Add Python to PATH") или просто откройте index.html двойным щелчком.
echo.
pause
:end
