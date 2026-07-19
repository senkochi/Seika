# Báo cáo thay đổi nghiệp vụ đối soát doanh thu Admin

## Thông tin thay đổi

| Thuộc tính          | Giá trị                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ |
| Ngày thực hiện      | 2026-07-19                                                                           |
| Phạm vi             | Trang Admin Revenue và API báo cáo của `wallet-service`                              |
| Nghiệp vụ liên quan | Nạp Coin, cash-out, marketplace purchase, escrow release, platform fee và promo sink |
| Trạng thái          | Đã triển khai                                                                        |
| Tài liệu gốc        | [`teacher-tiered-economy-v3.md`](../ideas/teacher-tiered-economy-v3.md)              |

## 1. Mục tiêu

Thay đổi này làm rõ báo cáo tài chính theo **góc nhìn kinh tế của nền tảng**. Báo cáo phải phân biệt được:

- Tiền VND thực tế đã vào hoặc đã ra khỏi hệ thống.
- Coin mà nền tảng được hưởng từ phí giao dịch.
- Coin promo bị triệt tiêu nhưng không tạo doanh thu VND.
- Nghĩa vụ cash-out hiện tại đối với giáo viên.
- Các chuyển động Coin nội bộ không làm phát sinh dòng tiền VND.

Mục tiêu quan trọng nhất là không để Admin hiểu một giá trị ước tính hoặc một chuyển động Coin nội bộ thành doanh thu tiền thật.

## 2. Các vấn đề trước khi sửa

### 2.1. Tỷ giá hiển thị không phản ánh lịch sử giao dịch

Tổng tiền nạp và tổng Coin được tính từ ledger lịch sử, nhưng phần mô tả lại dùng tỷ giá cấu hình hiện tại.

Ví dụ:

- Nạp 50 Coin với 10.000 VND, tương đương 200 VND/Coin.
- Nạp 100 Coin với 10.000 VND, tương đương 100 VND/Coin.
- Tổng cộng là 150 Coin và 20.000 VND.

Tỷ giá bình quân lịch sử đúng phải là:

```text
20.000 / 150 = 133,33 VND/Coin
```

Việc hiển thị 200 VND/Coin cho toàn bộ 150 Coin làm người đọc hiểu nhầm rằng tổng tiền nạp phải là 30.000 VND.

### 2.2. Paid-backed fee bị mô tả như doanh thu VND chính xác

Ledger hiện chỉ lưu số Coin phí, chưa lưu đầy đủ nguồn gốc từng lô paid Coin để xác định chính xác giá trị VND lịch sử của phí.

Giá trị sau chỉ là ước tính:

```text
paidBackedFeeCoins x currentTopupRate
```

Vì vậy tên `Paid-backed Fee Revenue` trước đây quá khẳng định. Giao diện mới dùng tên `Giá trị ước tính phí paid-backed`.

### 2.3. Promo sink được tính nhưng không được hiển thị

Backend đã tính `promoSinkCoins`, nhưng giao diện không có KPI tương ứng. Admin không thể biết bao nhiêu promo Coin đã bị loại khỏi lưu hành.

### 2.4. "Minimum Guaranteed Platform Profit" không thực sự được đảm bảo

Công thức cũ là:

```text
totalTopupVnd - totalWithdrawalVnd - currentCashOutLiabilityVnd
```

Công thức này chỉ trừ nghĩa vụ cash-out đang tồn tại trong `earnedWithdrawableBalance`. Nó chưa bao gồm:

- Paid Coin đang nằm trong ví học sinh và có thể được dùng mua nội dung sau này.
- Paid-backed escrow đang được giữ và có thể trở thành số dư có thể rút của giáo viên.
- Các nghĩa vụ tương lai chưa được tạo tại thời điểm chụp báo cáo.

Do đó giá trị này không phải lợi nhuận được đảm bảo. Tên mới là `Tiền ròng sau nghĩa vụ hiện tại`.

### 2.5. Chiều giao dịch và màu sắc không đồng bộ

Trước đây một số giao dịch nội bộ như thưởng học tập, thưởng khởi tạo và hoàn escrow bị đánh dấu là dòng tiền ra. Tất cả `ESCROW_RELEASE_CREDIT` cũng bị coi là outflow dù payout promo không thể cash-out.

### 2.6. Quy đổi VND cho giao dịch nội bộ bị sai ngữ nghĩa

Hệ thống từng dùng tỷ giá nạp hiện tại để quy đổi gần như mọi ledger entry. Ví dụ payout 24 Coin có thể rút bị hiển thị 4.800 VND ở tỷ giá nạp 200, trong khi nghĩa vụ cash-out đúng ở tỷ giá rút 90 là:

```text
24 x 90 = 2.160 VND
```

Reward, promo payout và promo sink cũng từng có giá trị VND dù không tạo dòng tiền thật.

## 3. Nguyên tắc nghiệp vụ sau khi sửa

### 3.1. Không cộng phí nền tảng lần thứ hai vào tiền vào

Tiền VND đã vào hệ thống tại thời điểm học sinh nạp Coin. Khi marketplace thu platform fee, hệ thống chỉ phân bổ một phần Coin đã tồn tại cho nền tảng.

Vì vậy:

- `TOP_UP` được tính vào tổng tiền vào.
- `PLATFORM_FEE_REAL` được báo cáo riêng như phần giá trị nền tảng giữ lại.
- Không cộng `PLATFORM_FEE_REAL` vào `totalTopupVnd`, vì làm vậy sẽ ghi nhận cùng một khoản tiền hai lần.

### 3.2. Escrow payout paid-backed làm tăng nghĩa vụ cash-out

Khi escrow paid-backed được release:

- Giáo viên nhận Coin vào `earnedWithdrawableBalance`.
- Chưa có VND rời khỏi hệ thống ngay tại thời điểm release.
- Tuy nhiên nghĩa vụ cash-out của nền tảng tăng lên.

Vì báo cáo giao dịch dùng góc nhìn kinh tế của Admin, payout này được hiển thị là outflow và quy đổi theo tỷ giá cash-out hiện tại.

### 3.3. Escrow payout promo là chuyển động nội bộ

Payout có source `EARNED_PROMO` không thể rút thành VND. Nó chỉ chuyển Coin promo sang số dư dùng trong ứng dụng, vì vậy được phân loại là trung tính và không có giá trị VND.

### 3.4. Giao dịch trung tính không có nghĩa là không quan trọng

`NEUTRAL` nghĩa là giao dịch có thay đổi Coin hoặc trạng thái ví nhưng không làm phát sinh tiền VND vào, tiền VND ra hoặc nghĩa vụ cash-out trực tiếp tại thời điểm ghi nhận.

## 4. Định nghĩa KPI mới

| KPI                              | Công thức                                                  | Ý nghĩa                                                        |
| -------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| Tổng tiền nạp thực tế            | Tổng `amountVnd` của `TOP_UP`                              | Tiền VND đã thực sự vào hệ thống                               |
| Tỷ giá nạp bình quân lịch sử     | `totalTopupVnd / totalTopupCoins`                          | Tỷ giá bình quân của các lần nạp đã xảy ra                     |
| Tổng tiền đã rút                 | Tổng `amountVnd` của `CASH_OUT`                            | Tiền VND đã thực sự ra khỏi hệ thống                           |
| Tỷ giá rút bình quân lịch sử     | `totalWithdrawalVnd / totalWithdrawalCoins`                | Tỷ giá bình quân của các lần cash-out đã xảy ra                |
| Giá trị ước tính phí paid-backed | `paidBackedFeeCoins x currentTopupRate`                    | Giá trị tham khảo của Coin phí theo tỷ giá nạp hiện tại        |
| Promo Coin đã triệt tiêu         | Tổng Coin của `PLATFORM_FEE_PROMO_SINK`                    | Coin promo bị loại khỏi lưu hành, không phải doanh thu VND     |
| Nghĩa vụ cash-out hiện tại       | `withdrawableCoinCirculation x currentWithdrawalRate`      | Số VND cần chi nếu toàn bộ số dư hiện có thể rút được cash-out |
| Tiền ròng sau nghĩa vụ hiện tại  | `totalTopupVnd - totalWithdrawalVnd - cashOutLiabilityVnd` | Ảnh chụp tiền ròng sau khi dự phòng nghĩa vụ hiện tại          |

### Ví dụ theo dữ liệu đã kiểm tra

Giả sử:

- Tổng tiền nạp: 20.000 VND.
- Tổng Coin đã nạp: 150 Coin.
- Chưa có cash-out thực tế.
- Paid-backed fee: 16 Coin.
- Tỷ giá nạp hiện tại: 200 VND/Coin.
- Coin có thể rút: 64 Coin.
- Tỷ giá cash-out hiện tại: 90 VND/Coin.

Kết quả:

```text
Tỷ giá nạp bình quân lịch sử = 20.000 / 150 = 133,33 VND/Coin
Giá trị ước tính paid-backed fee = 16 x 200 = 3.200 VND
Nghĩa vụ cash-out hiện tại = 64 x 90 = 5.760 VND
Tiền ròng sau nghĩa vụ hiện tại = 20.000 - 0 - 5.760 = 14.240 VND
```

Lưu ý: 3.200 VND phí paid-backed không được cộng thêm vào 20.000 VND tiền nạp.

## 5. Quy tắc phân loại giao dịch

| Ledger type                                       | Source                    | Phân loại | Dấu và màu      | Giá trị VND                                     |
| ------------------------------------------------- | ------------------------- | --------- | --------------- | ----------------------------------------------- |
| `TOP_UP`                                          | `PAID`                    | `INFLOW`  | `+`, xanh       | VND thực tế từ ledger                           |
| `PLATFORM_FEE_REAL`                               | `PLATFORM_FEE_REAL`       | `INFLOW`  | `+`, xanh       | Ước tính theo tỷ giá nạp nếu ledger chưa có VND |
| `CASH_OUT`                                        | `EARNED_WITHDRAWABLE`     | `OUTFLOW` | `-`, đỏ         | VND thực tế từ ledger                           |
| `ESCROW_RELEASE_CREDIT`                           | `EARNED_WITHDRAWABLE`     | `OUTFLOW` | `-`, đỏ         | Nghĩa vụ ước tính theo tỷ giá cash-out          |
| `ESCROW_RELEASE_CREDIT`                           | `EARNED_PROMO`            | `NEUTRAL` | Không dấu, vàng | Không quy đổi VND                               |
| `INITIAL_BONUS`                                   | `BONUS`                   | `NEUTRAL` | Không dấu, vàng | Không quy đổi VND                               |
| `LEARNING_REWARD`                                 | `REWARD`                  | `NEUTRAL` | Không dấu, vàng | Không quy đổi VND                               |
| `PURCHASE_DEBIT`                                  | Bất kỳ source mua hàng    | `NEUTRAL` | Không dấu, vàng | Không quy đổi VND                               |
| `ESCROW_REFUND_CREDIT`                            | Source gốc                | `NEUTRAL` | Không dấu, vàng | Không quy đổi VND                               |
| `PLATFORM_FEE_PROMO_SINK`                         | `PLATFORM_FEE_PROMO_SINK` | `NEUTRAL` | Không dấu, vàng | Không quy đổi VND                               |
| `WALLET_HOLD`, `WALLET_FREEZE`, `WALLET_UNFREEZE` | Tùy nghiệp vụ             | `NEUTRAL` | Không dấu, vàng | Không quy đổi VND                               |

> Dấu trong bảng là góc nhìn của nền tảng, không phải dấu cộng/trừ số dư trên ví của người dùng.

## 6. Thay đổi API

### `AdminRevenueStatsDTO`

Các field mới:

```text
averageTopupRate
averageWithdrawalRate
paidBackedFeeEstimatedVnd
paidCoinCirculation
netCashAfterCurrentLiabilityVnd
```

Các field cũ vẫn được trả về để tương thích với frontend hoặc client cũ:

```text
realRevenueVnd = paidBackedFeeEstimatedVnd
guaranteedProfitVnd = netCashAfterCurrentLiabilityVnd
potentialLiabilityVnd = cashOutLiabilityVnd
```

Các alias trên chỉ phục vụ tương thích. Client mới nên dùng field có tên đúng ngữ nghĩa.

### `AdminTransactionDTO`

Thêm:

```text
source
flowDirection
```

`source` cho phép phân biệt payout escrow có thể rút với payout promo. `amountVnd` có thể là `null` đối với giao dịch nội bộ không có tác động VND.

## 7. Thay đổi giao diện

Trang Admin Revenue hiện có năm KPI:

1. Tổng tiền nạp thực tế.
2. Tổng tiền đã rút.
3. Giá trị ước tính phí paid-backed.
4. Promo Coin đã triệt tiêu.
5. Nghĩa vụ cash-out hiện tại.

Banner tổng hợp đổi từ `Lợi nhuận đảm bảo tối thiểu` sang `Tiền ròng sau nghĩa vụ hiện tại`, kèm cảnh báo rằng số liệu chưa bao gồm paid Coin và paid-backed escrow có thể tạo nghĩa vụ tương lai.

Cột `Quy đổi VND` đổi thành `Tác động / ước tính VND` để thể hiện rõ có dòng là tiền thực tế và có dòng chỉ là ước tính nghĩa vụ hoặc giá trị.

## 8. Các file đã thay đổi

### Backend

- `src/services/wallet-service/src/main/java/com/cardy/walletService/dto/admin/AdminRevenueStatsDTO.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/dto/admin/AdminTransactionDTO.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/service/AdminRevenueService.java`
- `src/services/wallet-service/src/test/java/com/cardy/walletService/service/AdminRevenueServiceTest.java`

### Frontend

- `src/web-app/src/api/types.ts`
- `src/web-app/src/pages/admin/AdminRevenue.tsx`
- `src/web-app/src/pages/admin/adminRevenuePresentation.ts`
- `src/web-app/tests/adminRevenuePresentation.test.ts`
- `src/web-app/src/i18n/locales/vi/admin.json`
- `src/web-app/src/i18n/locales/en/admin.json`

## 9. Kiểm chứng

| Hạng mục                      | Kết quả      |
| ----------------------------- | ------------ |
| `AdminRevenueServiceTest`     | 2/2 test đạt |
| Frontend presentation test    | 6/6 test đạt |
| TypeScript typecheck          | Đạt          |
| Web production build          | Đạt          |
| Toàn bộ test `wallet-service` | 26/27 đạt    |
| `git diff --check`            | Đạt          |

Test `WalletServiceApplicationTests.contextLoads` không chạy được do môi trường chưa cung cấp `${CONFIG_SERVER_URL}`. Đây là lỗi cấu hình test đã tồn tại và không liên quan đến thay đổi nghiệp vụ báo cáo doanh thu.

## 10. Giới hạn còn lại

### 10.1. Chưa thể xác định chính xác VND lịch sử của paid-backed fee

Để tính chính xác, hệ thống phải giữ lineage hoặc cost basis của từng lô paid Coin từ lúc nạp đến lúc được dùng để mua sản phẩm và thu phí. Hiện tại ledger fee chỉ đủ để biết số Coin phí.

Do đó `paidBackedFeeEstimatedVnd` phải tiếp tục được hiểu là giá trị ước tính theo tỷ giá hiện tại.

### 10.2. Wallet-service chưa biết toàn bộ paid-backed escrow đang giữ

Escrow thuộc quyền sở hữu dữ liệu của `marketplace-service`. Báo cáo từ `wallet-service` chỉ biết nghĩa vụ đã đi vào `earnedWithdrawableBalance`.

Muốn có dự báo nghĩa vụ tương lai đầy đủ, cần thêm API hoặc event tổng hợp exposure từ marketplace mà không truy cập chéo database giữa hai service.

### 10.3. Không sử dụng lại thuật ngữ "guaranteed profit"

Chỉ được gọi là lợi nhuận đảm bảo khi công thức đã bao phủ mọi nghĩa vụ hiện tại và tương lai có thể xác định. Với dữ liệu hiện có, thuật ngữ đúng là `current snapshot` hoặc `net cash after current liability`.

## 11. Checklist manual test

- [ ] Nạp Coin ở hai tỷ giá khác nhau và kiểm tra tỷ giá bình quân lịch sử.
- [ ] Release escrow paid-backed và kiểm tra payout có dấu trừ, màu đỏ, source có thể rút.
- [ ] Kiểm tra VND của payout paid-backed được tính theo tỷ giá cash-out.
- [ ] Release escrow promo và kiểm tra giao dịch trung tính, không có VND.
- [ ] Kiểm tra `PLATFORM_FEE_REAL` có dấu cộng nhưng không làm tăng tổng tiền nạp.
- [ ] Kiểm tra `PLATFORM_FEE_PROMO_SINK` tăng KPI promo sink nhưng không tăng doanh thu VND.
- [ ] Thực hiện cash-out và kiểm tra tổng tiền đã rút tăng, nghĩa vụ hiện tại giảm tương ứng.
- [ ] Kiểm tra banner tiền ròng dùng công thức mới và hiển thị cảnh báo về paid Coin/escrow tương lai.
