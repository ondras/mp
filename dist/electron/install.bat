@echo off

:: Make sure this is Windows Vista or later
call :ensure_vista

:: Make sure the script is running as admin
call :ensure_admin

:: Get mp.bat location
set mp_path=%~dp0mp.bat
set icon_path=%~dp0icon.png

:: Register mp.bat under the "App Paths" key, so it can be found by
:: ShellExecute, the run command, the start menu, etc.
set app_paths_key=HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\mp.bat
call :reg add "%app_paths_key%" /d "%mp_path%" /f
call :reg add "%app_paths_key%" /v "UseUrl" /t REG_DWORD /d 1 /f

:: Register mp.bat under the "Applications" key to add some default verbs for
:: when mp is used from the "Open with" menu
set classes_root_key=HKLM\SOFTWARE\Classes
set app_key=%classes_root_key%\Applications\mp.bat
call :reg add "%app_key%" /v "FriendlyAppName" /d "mp" /f
call :add_verbs "%app_key%"

:: Add mp.bat to the "Open with" list for all audio file types
call :reg add "%classes_root_key%\SystemFileAssociations\audio\OpenWithList\mp.bat" /d "" /f

:: Add a capabilities key for mp, which is registered later on for use in the
:: "Default Programs" control panel
set capabilities_key=HKLM\SOFTWARE\Clients\Media\mp\Capabilities
call :reg add "%capabilities_key%" /v "ApplicationName" /d "mp" /f
call :reg add "%capabilities_key%" /v "ApplicationDescription" /d "mp music player" /f

:: Add file types
set supported_types_key=%app_key%\SupportedTypes
set file_associations_key=%capabilities_key%\FileAssociations

call :add_type "audio/wav"                        "audio" "Wave Audio"                 ".wav"
call :add_type "audio/mpeg"                       "audio" "MP3 Audio"                  ".mp3"
call :add_type "audio/mp4"                        "audio" "MPEG-4 Audio"               ".m4a"
call :add_type "audio/aac"                        "audio" "Raw AAC Audio"              ".aac"
call :add_type "audio/ogg"                        "audio" "Ogg Audio"                  ".oga" ".ogg"
call :add_type "audio/x-mpegurl"                  "audio" "M3U Playlist"               ".m3u" ".m3u8"

:: Register "Default Programs" entry
call :reg add "HKLM\SOFTWARE\RegisteredApplications" /v "mp" /d "SOFTWARE\Clients\Media\mp\Capabilities" /f

echo.
echo Installed successfully. You can now configure mp's file associations in the
echo Default Programs control panel.
echo.
<nul set /p =Press any key to open the Default Programs control panel . . .
pause >nul
control /name Microsoft.DefaultPrograms
exit 0

:die
	if not [%1] == [] echo %~1
	pause
	exit 1

:ensure_admin
	:: 'openfiles' is just a commmand that is present on all supported Windows
	:: versions, requires admin privileges and has no side effects, see:
	:: https://stackoverflow.com/questions/4051883/batch-script-how-to-check-for-admin-rights
	openfiles >nul 2>&1
	if errorlevel 1 (
		echo This batch script requires administrator privileges. Right-click on
		echo %~nx0 and select "Run as administrator".
		call :die
	)
	goto :EOF

:ensure_vista
	ver | find "XP" >nul
	if not errorlevel 1 (
		echo This batch script only works on Windows Vista and later. To create file
		echo associations on Windows XP, right click on a music/playlist file and use "Open with...".
		call :die
	)
	goto :EOF

:reg
	:: Wrap the reg command to check for errors
	>nul reg %*
	if errorlevel 1 set error=yes
	if [%error%] == [yes] echo Error in command: reg %*
	if [%error%] == [yes] call :die
	goto :EOF

:reg_set_opt
	:: Set a value in the registry if it doesn't already exist
	set key=%~1
	set value=%~2
	set data=%~3

	reg query "%key%" /v "%value%" >nul 2>&1
	if errorlevel 1 call :reg add "%key%" /v "%value%" /d "%data%"
	goto :EOF

:add_verbs
	set key=%~1

	:: Set the default verb to "play"
	call :reg add "%key%\shell" /d "play" /f

	:: Hide the "open" verb from the context menu, since it's the same as "play"
	call :reg add "%key%\shell\open" /v "LegacyDisable" /f

	:: Set open command
	call :reg add "%key%\shell\open\command" /d "\"%mp_path%\" \"%%%%L" /f

	:: Add "play" verb
	call :reg add "%key%\shell\play" /d "&Play" /f
	call :reg add "%key%\shell\play\command" /d "\"%mp_path%\" \"%%%%L" /f

	:: Add "enqueue" verb
	call :reg add "%key%\shell\enqueue" /d "En&queue" /f
	call :reg add "%key%\shell\enqueue\command" /d "\"%mp_path%\" -q \"%%%%L" /f

	goto :EOF

:add_progid
	set prog_id=%~1
	set friendly_name=%~2

	:: Add ProgId, edit flags are FTA_OpenIsSafe | FTA_AlwaysUseDirectInvoke
	set prog_id_key=%classes_root_key%\%prog_id%
	call :reg add "%prog_id_key%" /d "%friendly_name%" /f
	call :reg add "%prog_id_key%" /v "EditFlags" /t REG_DWORD /d 4259840 /f
	call :reg add "%prog_id_key%" /v "FriendlyTypeName" /d "%friendly_name%" /f
	call :reg add "%prog_id_key%\DefaultIcon" /d "%icon_path%" /f
	call :add_verbs "%prog_id_key%"

	goto :EOF

:update_extension
	set extension=%~1
	set prog_id=%~2
	set mime_type=%~3
	set perceived_type=%~4

	:: Add information about the file extension, if not already present
	set extension_key=%classes_root_key%\%extension%
	if not [%mime_type%] == [] call :reg_set_opt "%extension_key%" "Content Type" "%mime_type%"
	if not [%perceived_type%] == [] call :reg_set_opt "%extension_key%" "PerceivedType" "%perceived_type%"
	call :reg add "%extension_key%\OpenWithProgIds" /v "%prog_id%" /f

	:: Add type to SupportedTypes
	call :reg add "%supported_types_key%" /v "%extension%" /f

	:: Add type to the Default Programs control panel
	call :reg add "%file_associations_key%" /v "%extension%" /d "%prog_id%" /f

	goto :EOF

:add_type
	set mime_type=%~1
	set perceived_type=%~2
	set friendly_name=%~3
	set extension=%~4

	echo Adding "%extension%" file type

	:: Add ProgId
	set prog_id=mp%extension%
	call :add_progid "%prog_id%" "%friendly_name%"

	:: Add extensions
	:extension_loop
		call :update_extension "%extension%" "%prog_id%" "%mime_type%" "%perceived_type%"

		:: Trailing parameters are additional extensions
		shift /4
		set extension=%~4
		if not [%extension%] == [] goto extension_loop

	goto :EOF

