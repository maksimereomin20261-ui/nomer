#!/bin/bash
# НОМЕРА — локальный сервер (macOS / Linux)
cd "$(dirname "$0")" || exit 1
PORT=8000
echo ""
echo "  НОМЕРА — локальный сервер"
echo "  На этом компьютере: http://localhost:$PORT"
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
if [ -n "$IP" ]; then echo "  С телефона (та же Wi-Fi сеть): http://$IP:$PORT"; fi
echo "  Остановить сервер: Ctrl+C или закройте окно"
echo ""
( sleep 1; open "http://localhost:$PORT" 2>/dev/null || xdg-open "http://localhost:$PORT" >/dev/null 2>&1 ) &
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  python -m http.server "$PORT"
else
  echo "  Python 3 не найден. Установите его с https://www.python.org/downloads/"
  echo "  или просто откройте index.html двойным щелчком."
  read -r -p "  Нажмите Enter, чтобы закрыть..." _
fi
