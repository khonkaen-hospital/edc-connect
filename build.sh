
electron-packager . EdcConnect --overwrite --platform=darwin --arch=x64 --prune=true --out=release-builds

electron-packager . EdcConnect --overwrite --asar=true --platform=win32 --arch=ia32  --prune=true --out=release-builds --version-string.CompanyName=CE --version-string.FileDescription=CE --version-string.ProductName="EDC Connect"

electron-packager . EdcConnect --overwrite --asar=true --platform=win32 --arch=x64  --prune=true --out=release-builds --version-string.CompanyName=CE --version-string.FileDescription=CE --version-string.ProductName="EDC Connect" 



















