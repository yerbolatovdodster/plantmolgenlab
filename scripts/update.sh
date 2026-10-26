#!/bin/bash
# Вариант для хостинга на СВОЁМ сервере (вместо FTP-деплоя).
# Сервер раз в 5 минут проверяет GitHub и пересобирает сайт, если были изменения.
# Установка:
#   sudo git clone https://github.com/<ваша-организация>/plantmolgenlab.git /opt/plantmolgenlab
#   crontab -e   →   */5 * * * * /opt/plantmolgenlab/scripts/update.sh
set -e
REPO=/opt/plantmolgenlab
WEBROOT=/var/www/plantmolgenlab

cd "$REPO"
git fetch -q
if [ "$(git rev-parse HEAD)" != "$(git rev-parse @{u})" ]; then
  git pull -q
  hugo --minify
  rsync -a --delete public/ "$WEBROOT"/
  echo "$(date '+%F %T') обновлено" >> "$REPO/update.log"
fi
