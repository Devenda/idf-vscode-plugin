#Get start menu programs folder
$programsFolder = [environment]::getfolderpath("Programs") 

#Search for ESP-IDF Command Prompt
$idfcmdPath = (Get-ChildItem $programsFolder -Recurse | Where-Object {$_.Name.EndsWith(".lnk") -and $_.Name.Contains("ESP-IDF")}).FullName
$idfcmdPath

#Get Properties ("start in" and "Target") from lnk file
$sh = New-Object -ComObject WScript.Shell
$shortcut = $sh.CreateShortcut($idfcmdPath)

$target = $shortcut.Arguments
$startIn = $shortcut.WorkingDirectory

Write-Output $startIn
Write-Output $target
