[CmdletBinding()]
param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$AdminUsername,
    [string]$AdminPassword
)

$ErrorActionPreference = "Stop"

function Get-DotEnvValue([string]$Key) {
    $line = Get-Content ".env" | Where-Object { $_ -match "^$([regex]::Escape($Key))=" } | Select-Object -First 1
    if ($null -eq $line) { return $null }
    return $line.Substring($line.IndexOf("=") + 1).Trim()
}

if ([string]::IsNullOrWhiteSpace($AdminUsername)) {
    $AdminUsername = Get-DotEnvValue "ADMIN_USERNAME"
    if ([string]::IsNullOrWhiteSpace($AdminUsername)) {
        $AdminUsername = Get-DotEnvValue "ADMIN_INITIAL_USERNAME"
    }
}
if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
    $AdminPassword = Get-DotEnvValue "ADMIN_PASSWORD"
    if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
        $AdminPassword = Get-DotEnvValue "ADMIN_INITIAL_PASSWORD"
    }
}

function Login([string]$Username, [string]$Password) {
    Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" -ContentType "application/json" `
        -Body (@{ username = $Username; password = $Password } | ConvertTo-Json)
}

function Auth-Headers([string]$Token) {
    return @{ Authorization = "Bearer $Token" }
}

function Get-UserId([string]$Token) {
    $part = $Token.Split('.')[1].Replace('-', '+').Replace('_', '/')
    while ($part.Length % 4) { $part += '=' }
    $claims = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($part)) | ConvertFrom-Json
    return $claims.userId
}

function Assert-Decimal($Actual, [decimal]$Expected, [string]$Label) {
    if ([decimal]$Actual -ne $Expected) {
        throw "$Label expected $Expected but was $Actual"
    }
}

function Assert-Equal($Actual, $Expected, [string]$Label) {
    if ($Actual -ne $Expected) {
        throw "$Label expected '$Expected' but was '$Actual'"
    }
}

function Assert-Rejected([scriptblock]$Action, [string]$Label) {
    try {
        & $Action | Out-Null
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -ge 400 -and $status -lt 500) { return }
        throw "$Label returned unexpected status $status`: $($_.Exception.Message)"
    }
    throw "$Label was accepted but should have been rejected"
}

function Set-WalletConfig([string]$Key, [string]$Value) {
    Invoke-RestMethod -Method Put -Uri "$BaseUrl/api/wallet/admin/configs/$Key" -Headers $script:AdminHeaders `
        -ContentType "application/json" -Body (@{ value = $Value } | ConvertTo-Json) | Out-Null
}

function Set-MarketplaceConfig([string]$Key, [string]$Value) {
    Invoke-RestMethod -Method Put -Uri "$BaseUrl/api/marketplace/admin/configs/$Key" -Headers $script:AdminHeaders `
        -ContentType "application/json" -Body (@{ value = $Value } | ConvertTo-Json) | Out-Null
}

function New-Actor([string]$Role, [string]$Tag) {
    $username = "e2e_$($Role.ToLower())_$($script:RunId)_$Tag"
    $password = "Password@123"
    $body = @{
        username = $username
        password = $password
        role = $Role
        fullName = "E2E $Role $Tag $($script:RunId)"
        dateOfBirth = "1995-01-01"
        gender = "MALE"
        profilePictureUrl = ""
    } | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/register" -ContentType "application/json" -Body $body | Out-Null
    $login = Login $username $password
    return [pscustomobject]@{
        Username = $username
        UserId = Get-UserId $login.accessToken
        Token = $login.accessToken
        Headers = Auth-Headers $login.accessToken
    }
}

function Get-Wallet($Actor) {
    Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/wallet/balance/breakdown" -Headers $Actor.Headers
}

function Wait-WalletBonus($Actor, [decimal]$Expected) {
    $wallet = Get-Wallet $Actor
    for ($i = 0; $i -lt 40 -and [decimal]$wallet.bonusBalance -ne $Expected; $i++) {
        Start-Sleep -Milliseconds 500
        $wallet = Get-Wallet $Actor
    }
    Assert-Decimal $wallet.bonusBalance $Expected "Initial bonus for $($Actor.Username)"
    return $wallet
}

function New-Product($Teacher, [decimal]$Price, [string]$Tag, [bool]$Approve = $true) {
    $card = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/flashcards" -Headers $Teacher.Headers `
        -ContentType "application/json" -Body (@{
            title = "E2E $Tag $($script:RunId)"
            description = "Automated escrow audit"
            price = $Price
            cards = @(@{ frontSide = "front"; backSide = "back" })
        } | ConvertTo-Json -Depth 5)

    $product = $null
    for ($i = 0; $i -lt 50 -and $null -eq $product; $i++) {
        Start-Sleep -Milliseconds 500
        $page = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/marketplace/admin/products/pending?size=100" `
            -Headers $script:AdminHeaders
        $product = @($page.content) | Where-Object { $_.referenceId -eq $card.id } | Select-Object -First 1
    }
    if ($null -eq $product) { throw "Marketplace product was not created for card set $($card.id)" }
    if ($Approve) {
        Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/marketplace/admin/products/$($product.id)/approve" `
            -Headers $script:AdminHeaders | Out-Null
    }
    return [pscustomobject]@{ Product = $product; Card = $card; Teacher = $Teacher }
}

function Submit-Order($Buyer, $ProductBundle, [int]$Quantity = 1, [bool]$Tamper = $false) {
    $product = $ProductBundle.Product
    $card = $ProductBundle.Card
    $item = if ($Tamper) {
        @{
            productId = $product.id; productType = "QUIZ"; referenceId = "forged-reference"
            productName = "forged-name"; unitPrice = 1; quantity = $Quantity; sellerUserId = "forged-seller"
        }
    } else {
        @{
            productId = $product.id; productType = "FLASHCARD"; referenceId = $card.id
            productName = $product.name; unitPrice = $product.price; quantity = $Quantity
            sellerUserId = $ProductBundle.Teacher.UserId
        }
    }
    Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/marketplace/orders" -Headers $Buyer.Headers `
        -ContentType "application/json" -Body (@{ userId = "forged-buyer"; items = @($item) } | ConvertTo-Json -Depth 6)
}

function Buy-Product($Buyer, $ProductBundle, [bool]$Tamper = $false) {
    $order = Submit-Order $Buyer $ProductBundle 1 $Tamper
    $current = $order
    for ($i = 0; $i -lt 60 -and $current.status -eq "PENDING_PAYMENT"; $i++) {
        Start-Sleep -Milliseconds 500
        $current = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/marketplace/orders/$($order.id)" `
            -Headers $Buyer.Headers
    }
    Assert-Equal $current.status "PAID" "Order status"
    $escrow = $null
    for ($i = 0; $i -lt 40 -and $null -eq $escrow; $i++) {
        Start-Sleep -Milliseconds 500
        $escrow = @(Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/marketplace/escrows/me" `
            -Headers $Buyer.Headers) | Where-Object { $_.orderId -eq $order.id } | Select-Object -First 1
    }
    if ($null -eq $escrow) { throw "Escrow not created for order $($order.id)" }
    return [pscustomobject]@{ Order = $order; Escrow = $escrow }
}

function Wait-Escrow($Buyer, [string]$EscrowId, [scriptblock]$Predicate) {
    $escrow = $null
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Milliseconds 500
        $escrow = @(Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/marketplace/escrows/me" `
            -Headers $Buyer.Headers) | Where-Object { $_.id -eq $EscrowId } | Select-Object -First 1
        if ($null -ne $escrow -and (& $Predicate $escrow)) { return $escrow }
    }
    throw "Timed out waiting for escrow $EscrowId"
}

function Force-Release($Buyer, $Purchase) {
    Invoke-RestMethod -Method Post `
        -Uri "$BaseUrl/api/marketplace/admin/order-items/$($Purchase.Escrow.orderItemId)/force-release" `
        -Headers $script:AdminHeaders -ContentType "application/json" -Body '{"reason":"automated E2E release"}' | Out-Null
    return Wait-Escrow $Buyer $Purchase.Escrow.id { param($e) $e.status -eq "RELEASED" }
}

$script:RunId = Get-Date -Format "yyyyMMddHHmmss"
$admin = Login $AdminUsername $AdminPassword
$script:AdminHeaders = Auth-Headers $admin.accessToken
$walletConfigs = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/wallet/admin/configs" -Headers $script:AdminHeaders
$marketConfigs = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/marketplace/admin/configs" -Headers $script:AdminHeaders
$originalStudentInitial = ($walletConfigs | Where-Object { $_.key -eq "STUDENT_INITIAL_COIN" }).value
$originalHoldDays = ($marketConfigs | Where-Object { $_.key -eq "ESCROW_HOLD_DAYS" }).value
$originalEscrowFee = ($marketConfigs | Where-Object { $_.key -eq "ESCROW_OPERATION_FEE_PERCENT" }).value
$results = [System.Collections.Generic.List[object]]::new()

try {
    Set-MarketplaceConfig "ESCROW_HOLD_DAYS" "7"
    Set-MarketplaceConfig "ESCROW_OPERATION_FEE_PERCENT" "0"

    Set-WalletConfig "STUDENT_INITIAL_COIN" "500"
    $bonusTeacher = New-Actor "TEACHER" "bonus"
    $bonusStudent = New-Actor "STUDENT" "bonus"
    Wait-WalletBonus $bonusStudent 500 | Out-Null
    $bonusProduct = New-Product $bonusTeacher 100 "BONUS" $true
    $bonusPurchase = Buy-Product $bonusStudent $bonusProduct $true
    Assert-Decimal $bonusPurchase.Order.totalAmount 100 "Canonical order total"
    Assert-Decimal $bonusPurchase.Escrow.grossAmount 100 "Bonus escrow gross"
    Assert-Decimal $bonusPurchase.Escrow.bonusBackedAmount 100 "Bonus escrow source"
    Assert-Equal $bonusPurchase.Escrow.sellerId $bonusTeacher.UserId "Canonical seller"
    $bonusReleased = Force-Release $bonusStudent $bonusPurchase
    $bonusTeacherWallet = Get-Wallet $bonusTeacher
    Assert-Decimal $bonusTeacherWallet.earnedPromoBalance 80 "Bonus teacher promo earning"
    Assert-Decimal $bonusTeacherWallet.earnedWithdrawableBalance 0 "Bonus teacher withdrawable earning"
    Assert-Decimal $bonusReleased.platformFeePromoSink 20 "Bonus platform promo sink"
    $results.Add([pscustomobject]@{ scenario = "bonus_canonical_release"; status = "PASS" })

    $pendingProduct = New-Product $bonusTeacher 100 "PENDING" $false
    Assert-Rejected { Submit-Order $bonusStudent $pendingProduct 1 $false } "Unpublished product purchase"
    $results.Add([pscustomobject]@{ scenario = "unpublished_product_rejected"; status = "PASS" })

    Set-WalletConfig "STUDENT_INITIAL_COIN" "0"
    $paidTeacher = New-Actor "TEACHER" "paid"
    $paidStudent = New-Actor "STUDENT" "paid"
    Wait-WalletBonus $paidStudent 0 | Out-Null
    Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/wallet/top-up" -Headers $paidStudent.Headers `
        -ContentType "application/json" -Body '{"amountVnd":20000}' | Out-Null
    $paidProduct = New-Product $paidTeacher 100 "PAID" $true
    Assert-Rejected { Submit-Order $paidStudent $paidProduct 2 $false } "Digital quantity greater than one"
    $paidPurchase = Buy-Product $paidStudent $paidProduct $false
    Assert-Decimal $paidPurchase.Escrow.paidBackedAmount 100 "Paid escrow source"
    $paidReleased = Force-Release $paidStudent $paidPurchase
    $paidTeacherWallet = Get-Wallet $paidTeacher
    Assert-Decimal $paidTeacherWallet.earnedWithdrawableBalance 80 "Paid teacher withdrawable earning"
    Assert-Decimal $paidReleased.platformFeeReal 20 "Paid platform fee"
    Assert-Rejected {
        Invoke-RestMethod -Method Post `
            -Uri "$BaseUrl/api/marketplace/admin/order-items/$($paidPurchase.Escrow.orderItemId)/refund" `
            -Headers $script:AdminHeaders -ContentType "application/json" -Body '{"reason":"too late"}'
    } "Refund after release"
    $results.Add([pscustomobject]@{ scenario = "paid_release_and_post_release_guard"; status = "PASS" })

    Set-WalletConfig "STUDENT_INITIAL_COIN" "50"
    $mixedTeacher = New-Actor "TEACHER" "mixed"
    $mixedStudent = New-Actor "STUDENT" "mixed"
    Wait-WalletBonus $mixedStudent 50 | Out-Null
    Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/wallet/top-up" -Headers $mixedStudent.Headers `
        -ContentType "application/json" -Body '{"amountVnd":10000}' | Out-Null
    $mixedProduct = New-Product $mixedTeacher 100 "MIXED" $true
    $mixedPurchase = Buy-Product $mixedStudent $mixedProduct $false
    Assert-Decimal $mixedPurchase.Escrow.bonusBackedAmount 50 "Mixed bonus source"
    Assert-Decimal $mixedPurchase.Escrow.paidBackedAmount 50 "Mixed paid source"
    Invoke-RestMethod -Method Post `
        -Uri "$BaseUrl/api/marketplace/admin/order-items/$($mixedPurchase.Escrow.orderItemId)/partial-refund" `
        -Headers $script:AdminHeaders -ContentType "application/json" `
        -Body '{"amount":40,"reason":"automated partial refund"}' | Out-Null
    $mixedRemaining = Wait-Escrow $mixedStudent $mixedPurchase.Escrow.id {
        param($e) [decimal]$e.grossAmount -eq 60 -and $null -eq $e.refundRequestedAt
    }
    Assert-Decimal $mixedRemaining.bonusBackedAmount 30 "Mixed remaining bonus"
    Assert-Decimal $mixedRemaining.paidBackedAmount 30 "Mixed remaining paid"
    $mixedReleased = Force-Release $mixedStudent ([pscustomobject]@{ Escrow = $mixedRemaining })
    $mixedTeacherWallet = Get-Wallet $mixedTeacher
    Assert-Decimal $mixedTeacherWallet.earnedPromoBalance 24 "Mixed teacher promo earning"
    Assert-Decimal $mixedTeacherWallet.earnedWithdrawableBalance 24 "Mixed teacher withdrawable earning"
    Assert-Decimal $mixedReleased.platformFeePromoSink 6 "Mixed promo fee"
    Assert-Decimal $mixedReleased.platformFeeReal 6 "Mixed real fee"
    $results.Add([pscustomobject]@{ scenario = "mixed_partial_refund_then_release"; status = "PASS" })

    Set-WalletConfig "STUDENT_INITIAL_COIN" "100"
    $refundTeacher = New-Actor "TEACHER" "refund"
    $refundStudent = New-Actor "STUDENT" "refund"
    Wait-WalletBonus $refundStudent 100 | Out-Null
    $refundProduct = New-Product $refundTeacher 100 "REFUND" $true
    $refundPurchase = Buy-Product $refundStudent $refundProduct $false
    Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/marketplace/escrows/$($refundPurchase.Escrow.id)/refund" `
        -Headers $refundStudent.Headers | Out-Null
    $refunded = Wait-Escrow $refundStudent $refundPurchase.Escrow.id { param($e) $e.status -eq "REFUNDED" }
    $refundStudentWallet = Get-Wallet $refundStudent
    $refundTeacherWallet = Get-Wallet $refundTeacher
    Assert-Decimal $refundStudentWallet.bonusBalance 100 "Self-refund source restoration"
    Assert-Decimal $refundTeacherWallet.balance 0 "Self-refund teacher balance"
    $results.Add([pscustomobject]@{ scenario = "self_refund_before_release"; status = "PASS" })

    [pscustomobject]@{ runId = $script:RunId; status = "PASS"; scenarios = $results } | ConvertTo-Json -Depth 5
} finally {
    if ($null -ne $originalStudentInitial) { Set-WalletConfig "STUDENT_INITIAL_COIN" $originalStudentInitial }
    if ($null -ne $originalHoldDays) { Set-MarketplaceConfig "ESCROW_HOLD_DAYS" $originalHoldDays }
    if ($null -ne $originalEscrowFee) { Set-MarketplaceConfig "ESCROW_OPERATION_FEE_PERCENT" $originalEscrowFee }
}
