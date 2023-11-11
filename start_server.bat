@echo off
rem Set the path to your Python interpreter
set python_executable=python

rem Set the path to your Python script
set python_script=shape_test.py

rem Navigate to the script's directory
cd %~dp0

rem Open a new command prompt window and execute the Python script
start cmd /k %python_executable% %python_script%

rem Navigate to your react folder
cd react
cd firemap

rem Open a new command prompt window and start the react app
start cmd /k npm start
