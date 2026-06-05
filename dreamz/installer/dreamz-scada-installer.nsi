; Dreamz SCADA Installer Script (NSIS)
; Requires NSIS 3.x

!define APP_NAME     "Dreamz SCADA"
!define APP_VERSION  "${APP_VERSION}" ; will be injected by CI
!define APP_EXE      "dreamz-scada.exe"
!define INSTALL_DIR  "$PROGRAMFILES64\\Dreamz Automation\\Dreamz SCADA"

Name "${APP_NAME} ${APP_VERSION}"
OutFile "DreamzSCADA-${APP_VERSION}-Setup.exe"
InstallDir "${INSTALL_DIR}"
RequestExecutionLevel admin

Page directory
Page instfiles

Section "Install"
  SetOutPath "$INSTDIR"
  ; Include all built files from the Electron build
  File /r "*.*"

  ; Include NSSM executable (already added to resources)
  File "nssm.exe"

  ; Create Windows Service using NSSM
  ExecWait '"$INSTDIR\nssm.exe" install "DreamzSCADA" "$INSTDIR\${APP_EXE}"'
  ExecWait '"$INSTDIR\nssm.exe" set DreamzSCADA Start SERVICE_AUTO_START'
  ExecWait 'net start DreamzSCADA'

  ; Create Start Menu shortcut
  CreateDirectory "$SMPROGRAMS\\Dreamz Automation"
  CreateShortCut "$SMPROGRAMS\\Dreamz Automation\\Dreamz SCADA.lnk" "$INSTDIR\${APP_EXE}"

  ; Write uninstall information
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\DreamzSCADA" "DisplayName" "Dreamz SCADA"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\DreamzSCADA" "UninstallString" "$INSTDIR\Uninstall.exe"

  ; Launch browser to open the SCADA UI
  ExecShell "open" "http://127.0.0.1:1881"
SectionEnd

Section "Uninstall"
  ; Stop and remove service
  ExecWait 'net stop DreamzSCADA'
  ExecWait '"$INSTDIR\nssm.exe" remove DreamzSCADA confirm'
  ; Remove installed files and shortcuts
  RMDir /r "$INSTDIR"
  Delete "$SMPROGRAMS\\Dreamz Automation\\Dreamz SCADA.lnk"
  DeleteRegKey HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\DreamzSCADA"
SectionEnd
