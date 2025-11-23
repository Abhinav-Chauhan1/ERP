# Fix all instances of Link wrapping Button
$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName | Out-String
    $originalContent = $content
    
    # Pattern 1: <Link href="..."><Button>...</Button></Link>
    # Replace with: <Button asChild><Link href="...">...</Link></Button>
    
    # This is complex, so we'll do a simpler approach:
    # Find Link wrapping Button and add a marker
    if ($content -match '<Link\s+href=') {
        Write-Host "Checking: $($file.FullName)"
        
        # Read line by line to find the pattern
        $lines = Get-Content $file.FullName
        $modified = $false
        $newLines = @()
        $i = 0
        
        while ($i -lt $lines.Count) {
            $line = $lines[$i]
            
            # Check if this line has <Link href and next line has <Button
            if ($line -match '<Link\s+href=' -and $i + 1 -lt $lines.Count) {
                $nextLine = $lines[$i + 1]
                
                if ($nextLine -match '^\s*<Button' -and $nextLine -notmatch 'asChild') {
                    Write-Host "  Found pattern at line $($i + 1)"
                    # This needs manual review - skip for now
                }
            }
            
            $newLines += $line
            $i++
        }
    }
}

Write-Host "Manual fix required - pattern is too complex for automated replacement"
