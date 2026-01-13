Write-Host "Starting OmniVision extension build..."

$distExt = "dist-extension"

# Remove old folder
if (Test-Path $distExt) {
    Write-Host "Removing old dist-extension folder..."
    Remove-Item -Recurse -Force $distExt
}

# Create new folder
Write-Host "Creating new dist-extension folder..."
New-Item -ItemType Directory -Path $distExt | Out-Null

# Copy Vite build output
Write-Host "Copying Vite build from dist/ ..."
Copy-Item -Path "dist\*" -Destination $distExt -Recurse

# Copy manifest.json
Write-Host "Copying manifest.json ..."
Copy-Item -Path "manifest.json" -Destination $distExt

# Copy background.js
Write-Host "Copying background.js ..."
Copy-Item -Path "background.js" -Destination $distExt

# Copy contentScript.js
Write-Host "Copying contentScript.js ..."
Copy-Item -Path "contentScript.js" -Destination $distExt

# Copy offscreen files
Write-Host "Copying offscreen files ..."
Copy-Item -Path "offscreen.html" -Destination $distExt
Copy-Item -Path "offscreen.js" -Destination $distExt

# Copy public/ folder
if (Test-Path "public") {
    Write-Host "Copying public folder ..."
    Copy-Item -Path "public" -Destination "$distExt\public" -Recurse
}

Write-Host "Build complete. dist-extension folder is ready."
