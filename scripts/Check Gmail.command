#!/bin/zsh
cd -- "${0:A:h}" || exit 1
python3 check-gmail-smtp.py
printf '\nPress Return to close this check. '
read -r
