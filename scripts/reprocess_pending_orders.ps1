$header = @{Authorization = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('guest:guest'))}

$order1Payload = '{"eventId":"d2989e86-e497-4d29-b55f-cbc9c5dc0705","eventType":"wallet.debit.succeeded","idempotencyKey":"order:1478b50b-5ab9-4cde-bfaa-79415054f620:debit","orderId":"1478b50b-5ab9-4cde-bfaa-79415054f620","buyerUserId":"afd75044-46ce-4a66-9519-bc7267a3b65a","totalAmount":30.00,"sourceBreakdown":{"bonusAmount":0,"rewardAmount":0,"earnedPromoAmount":0,"paidAmount":30.00,"promoBackedAmount":0}}'
$body1 = @{
    properties = @{ content_type = "application/json" }
    routing_key = "marketplace.wallet-events"
    payload = $order1Payload
    payload_encoding = "string"
} | ConvertTo-Json

$res1 = Invoke-RestMethod -Uri 'http://localhost:15672/api/exchanges/%2F/amq.default/publish' -Method Post -Headers $header -ContentType 'application/json' -Body $body1
Write-Host "Order 1 publish response: $($res1 | ConvertTo-Json)"

$order2Payload = '{"eventId":"15f357bf-b7e2-4c5e-bcb2-ea05bdcad832","eventType":"wallet.debit.succeeded","idempotencyKey":"order:86daeca4-eaad-4adf-8510-b43669343ff1:debit","orderId":"86daeca4-eaad-4adf-8510-b43669343ff1","buyerUserId":"afd75044-46ce-4a66-9519-bc7267a3b65a","totalAmount":50.00,"sourceBreakdown":{"bonusAmount":0,"rewardAmount":0,"earnedPromoAmount":0,"paidAmount":50.00,"promoBackedAmount":0}}'
$body2 = @{
    properties = @{ content_type = "application/json" }
    routing_key = "marketplace.wallet-events"
    payload = $order2Payload
    payload_encoding = "string"
} | ConvertTo-Json

$res2 = Invoke-RestMethod -Uri 'http://localhost:15672/api/exchanges/%2F/amq.default/publish' -Method Post -Headers $header -ContentType 'application/json' -Body $body2
Write-Host "Order 2 publish response: $($res2 | ConvertTo-Json)"
