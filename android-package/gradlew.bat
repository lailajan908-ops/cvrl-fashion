@if "%DEBUG%"=="" @echo off
@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal
set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%
set DEFAULT_JVM_OPTS="-Xmx64m"
set JAVA_HOME=C:\Users\latif\AppData\Local\Temp\jre11-extracted\jdk-11.0.11+9-jre
"%JAVA_HOME%\bin\java.exe" %DEFAULT_JVM_OPTS% -jar "%APP_HOME%\gradle\wrapper\gradle-wrapper.jar" %*
if "%ERRORLEVEL%"=="0" goto mainEnd
:mainEnd
endlocal
