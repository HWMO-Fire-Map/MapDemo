@echo off
setlocal enabledelayedexpansion

set react_path=react\firemap
set build_folder=build
set zip_prefix=build_

:: Navigate to the React project directory
cd %react_path%

:: Run the build command (replace this with your actual build command)
call npm run build

:: Check if the build command was successful before proceeding
if %errorlevel% neq 0 (
    echo Error: npm build failed.
    pause
    exit /b 1
)

:: Find the latest build number
set /a latest_build_number=0
for %%i in (%zip_prefix%*) do (
    set "filename=%%i"
    set "filename=!filename:%zip_prefix%=!"

    if !filename! gtr !latest_build_number! (
        set /a latest_build_number=!filename!
    )
)

:: Increment the latest build number
set /a latest_build_number+=1

:: Zip the build folder with the new build number
set zip_name=%zip_prefix%%latest_build_number%.zip
powershell Compress-Archive -Path %build_folder% -DestinationPath %zip_name%

echo Build completed and zipped to %zip_name%
exit /b 0