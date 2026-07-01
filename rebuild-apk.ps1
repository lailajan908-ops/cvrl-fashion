param()

$ErrorActionPreference = "Stop"

$javadir = "C:\Users\latif\AppData\Local\Temp\jre11-extracted\jdk-11.0.11+9-jre"
$apksigner = "C:\Users\latif\AppData\Local\Android\Sdk\build-tools\37.0.0\apksigner.bat"
$zipalign = "C:\Users\latif\AppData\Local\Android\Sdk\build-tools\37.0.0\zipalign.exe"
$keystore = "C:\Users\latif\cvrl-fashion\cvrl-keystore-new.jks"
$signedApk = "C:\Users\latif\cvrl-fashion\cvrl-fashion-signed.apk"
$icons = "C:\Users\latif\cvrl-fashion\android-package\app\src\main\res"
$workRoot = "C:\Users\latif\AppData\Local\Temp\apk-work"
$tmpApk = "C:\Users\latif\cvrl-fashion\app-unsigned.apk"

# Use timestamped dir to avoid conflicts
$stamp = [DateTime]::Now.ToString("yyyyMMddHHmmss")
$work = "$workRoot\$stamp"

# Clean old unsigned apk
if (Test-Path $tmpApk) { Remove-Item -Force $tmpApk }

# Kill any stale handles on workRoot
if (Test-Path $workRoot) {
    try { Remove-Item -Recurse -Force $workRoot -ErrorAction SilentlyContinue } catch {}
}
Start-Sleep -Seconds 1
New-Item -ItemType Directory -Path $work -Force | Out-Null

Write-Host "=== Unzipping old APK ==="
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($signedApk)
[System.IO.Compression.ZipFileExtensions]::ExtractToDirectory($zip, "$work\apk_unpacked")
$zip.Dispose()

Write-Host "=== Replacing icons ==="
$densities = @("mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi")
foreach ($d in $densities) {
    $srcDir = Join-Path $icons $d
    $dstDir = Join-Path "$work\apk_unpacked\res" $d
    if (Test-Path $dstDir) {
        Get-ChildItem $srcDir -Filter "ic_launcher*" | ForEach-Object {
            Copy-Item $_.FullName $dstDir -Force
            Write-Host "  Copied: $d/$($_.Name)"
        }
    }
}

Write-Host "=== Removing old signature ==="
Remove-Item -Recurse -Force "$work\apk_unpacked\META-INF" -ErrorAction SilentlyContinue

Write-Host "=== Creating unsigned APK ==="
[System.IO.Compression.ZipFile]::CreateFromDirectory("$work\apk_unpacked", $tmpApk, [System.IO.Compression.CompressionLevel]::Optimal, $false)

Write-Host "=== Zip aligning ==="
$alignedApk = "$work\app-aligned.apk"
& $zipalign -v 4 $tmpApk $alignedApk 2>&1
if ($LASTEXITCODE -ne 0) { throw "zipalign failed" }

Write-Host "=== Signing APK ==="
$env:JAVA_HOME = $javadir
$env:PATH = "$javadir\bin;$env:PATH"
& $apksigner sign --ks $keystore --ks-pass pass:latif4321 --ks-key-alias cvrl --out $signedApk $alignedApk 2>&1
if ($LASTEXITCODE -ne 0) { throw "apksigner sign failed" }

Write-Host "=== Verifying ==="
& $apksigner verify $signedApk 2>&1

Write-Host ""
Write-Host "DONE! New APK at: $signedApk"
