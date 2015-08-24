#!/bin/bash
set -x

mkdir -p ./dist/osx

wget -O ./dist/electron-darwin.zip https://github.com/atom/electron/releases/download/v0.30.4/electron-v0.30.4-darwin-x64.zip
unzip -d ./dist/osx ./dist/electron-darwin.zip
rm ./dist/electron-darwin.zip

# Copy the app into the Electron Resources dir, and rename the folder to Sparc
rm -r ./dist/osx/Electron.app/Contents/Resources/*
cp ./app ./dist/osx/Electron.app/Contents/Resources/
mv ./dist/osx/Electron.app ./dist/osx/Sparc.app
zip -r ./dist/osx/Sparc.zip ./dist/osx/Sparc.app
