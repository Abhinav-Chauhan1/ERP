# Quick Rate Limit Test Script
# Tests rate limiting by making multiple requests

$url = "http://localhost:3000/api/test-rate-limit"
$successCount = 0
$rateLimitedCount = 0

Write-Host "Testing Rate Limiting..." -ForegroundColor Cyan
Write-Host "Making 105 requests to $url" -ForegroundColor Cyan
Write-Host ""

for ($i = 1; $i -le 105; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -ErrorAction Stop
        $successCount++
        
        $limit = $response.Headers['X-RateLimit-Limit']
        $remaining = $response.Headers['X-RateLimit-Remaining']
        
        if ($i -le 5 -or $i -ge 99) {
            Write-Host "Request $i : SUCCESS (Status: $($response.StatusCode), Remaining: $remaining)" -ForegroundColor Green
        } elseif ($i -eq 50) {
            Write-Host "... (showing first 5 and last 7 requests)" -ForegroundColor Gray
        }
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            $rateLimitedCount++
            $retryAfter = $_.Exception.Response.Headers['Retry-After']
            Write-Host "Request $i : RATE LIMITED (Status: 429, Retry-After: $retryAfter)" -ForegroundColor Red
        }
        else {
            Write-Host "Request $i : ERROR (Status: $($_.Exception.Response.StatusCode))" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "=== Test Results ===" -ForegroundColor Cyan
Write-Host "Successful requests: $successCount" -ForegroundColor Green
Write-Host "Rate limited requests: $rateLimitedCount" -ForegroundColor Red

if ($successCount -le 100 -and $rateLimitedCount -ge 5) {
    Write-Host ""
    Write-Host "Rate limiting is working correctly!" -ForegroundColor Green
    Write-Host "  - Allowed approximately 100 requests" -ForegroundColor Green
    Write-Host "  - Blocked $rateLimitedCount requests with 429 status" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "Rate limiting may not be working as expected" -ForegroundColor Yellow
    Write-Host "  - Expected: approximately 100 successful, approximately 5 rate limited" -ForegroundColor Yellow
    Write-Host "  - Actual: $successCount successful, $rateLimitedCount rate limited" -ForegroundColor Yellow
}
