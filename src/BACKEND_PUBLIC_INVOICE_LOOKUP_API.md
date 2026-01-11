# 🔍 BACKEND API SPECIFICATION - PUBLIC INVOICE LOOKUP

## 📋 **TỔNG QUAN**

API tra cứu hóa đơn điện tử dành cho **khách hàng công khai** (không cần đăng nhập). API này cho phép khách hàng tra cứu thông tin hóa đơn bằng mã tra cứu bí mật.

---

## 🎯 **YÊU CẦU CHỨC NĂNG**

### **1. Business Requirements:**
- ✅ Khách hàng nhập **mã tra cứu** (lookup code) để tìm hóa đơn
- ✅ Không cần đăng nhập/authentication
- ✅ Bảo mật bằng CAPTCHA (frontend validate)
- ✅ Chỉ trả về thông tin cơ bản (không có dữ liệu nhạy cảm)
- ✅ Hỗ trợ download PDF hóa đơn
- ✅ Rate limiting để tránh abuse

### **2. Security Requirements:**
- ✅ Mã tra cứu phải **unique** và **random** (UUID hoặc tương đương)
- ✅ Rate limiting: Tối đa 10 request/IP/phút
- ✅ Không trả về thông tin nhạy cảm (digital signature, XML path, internal IDs)
- ✅ Log tất cả tra cứu để audit
- ✅ Chặn SQL injection, XSS trong lookup code

---

## 🚀 **API ENDPOINT SPECIFICATION**

### **Endpoint:** 
```
GET /api/Invoice/public/lookup/{lookupCode}
```

### **Method:** `GET`

### **Authentication:** ❌ **KHÔNG CẦN** (Public endpoint)

### **Rate Limiting:** 
- 10 requests per IP per minute
- 429 Too Many Requests nếu vượt quá

---

## 📥 **REQUEST**

### **Path Parameters:**

| Parameter    | Type   | Required | Description                          | Example                        |
|-------------|--------|----------|--------------------------------------|--------------------------------|
| lookupCode  | string | ✅ Yes   | Mã tra cứu bí mật (8-16 ký tự)      | `LC8A7B9C4D`                  |

### **Query Parameters:** Không có

### **Headers:**

```http
Accept: application/json
Content-Type: application/json
```

### **Request Example:**

```http
GET /api/Invoice/public/lookup/LC8A7B9C4D HTTP/1.1
Host: api.yourdomain.com
Accept: application/json
```

---

## 📤 **RESPONSE**

### **Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Tra cứu thành công",
  "data": {
    "invoiceNumber": "0000123",
    "serialNumber": "K24TNT",
    "templateCode": "01GTTT0/001",
    "issueDate": "15/12/2024",
    "customerName": "CÔNG TY TNHH ABC",
    "taxCode": "0123456789",
    "totalAmount": 10000000,
    "taxAmount": 1000000,
    "status": "Đã phát hành",
    "taxAuthorityCode": "CKS24A1B2C3D4E5",
    "pdfUrl": "https://storage.yourdomain.com/invoices/2024/12/invoice-123.pdf"
  }
}
```

### **Response Fields:**

| Field              | Type    | Required | Description                                    | Example              |
|-------------------|---------|----------|------------------------------------------------|----------------------|
| invoiceNumber     | string  | ✅       | Số hóa đơn                                     | "0000123"           |
| serialNumber      | string  | ✅       | Ký hiệu hóa đơn (template serial)             | "K24TNT"            |
| templateCode      | string  | ✅       | Mẫu số hóa đơn                                 | "01GTTT0/001"       |
| issueDate         | string  | ✅       | Ngày phát hành (format: DD/MM/YYYY)           | "15/12/2024"        |
| customerName      | string  | ✅       | Tên khách hàng (công ty)                       | "CÔNG TY TNHH ABC"  |
| taxCode           | string  | ✅       | Mã số thuế khách hàng                          | "0123456789"        |
| totalAmount       | number  | ✅       | Tổng tiền thanh toán (VNĐ)                     | 10000000            |
| taxAmount         | number  | ✅       | Tiền thuế VAT (VNĐ)                            | 1000000             |
| status            | string  | ✅       | Trạng thái hóa đơn                             | "Đã phát hành"      |
| taxAuthorityCode  | string  | ❌       | Mã CQT (optional, nếu đã gửi CQT)              | "CKS24A1B2C3D4E5"  |
| pdfUrl            | string  | ❌       | Link download PDF (optional, signed URL)       | "https://..."       |

### **Error Responses:**

#### **404 Not Found - Không tìm thấy hóa đơn:**
```json
{
  "success": false,
  "message": "Không tìm thấy hóa đơn với mã tra cứu này",
  "errorCode": "INVOICE_NOT_FOUND"
}
```

#### **400 Bad Request - Mã tra cứu không hợp lệ:**
```json
{
  "success": false,
  "message": "Mã tra cứu không hợp lệ. Vui lòng kiểm tra lại",
  "errorCode": "INVALID_LOOKUP_CODE"
}
```

#### **429 Too Many Requests - Quá nhiều request:**
```json
{
  "success": false,
  "message": "Bạn đã vượt quá giới hạn tra cứu. Vui lòng thử lại sau 1 phút",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

#### **500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Lỗi hệ thống. Vui lòng thử lại sau",
  "errorCode": "INTERNAL_SERVER_ERROR"
}
```

---

## 🗄️ **DATABASE REQUIREMENTS**

### **1. Thêm cột `LookupCode` vào bảng `Invoice`:**

```sql
ALTER TABLE Invoice
ADD LookupCode NVARCHAR(16) NULL;

-- Tạo index unique cho lookup code
CREATE UNIQUE INDEX IX_Invoice_LookupCode 
ON Invoice(LookupCode) 
WHERE LookupCode IS NOT NULL;

-- Tạo index cho performance
CREATE INDEX IX_Invoice_LookupCode_Status 
ON Invoice(LookupCode, InvoiceStatusID);
```

### **2. Bảng `InvoiceLookupLog` (Audit trail):**

```sql
CREATE TABLE InvoiceLookupLog (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    InvoiceID INT NOT NULL,
    LookupCode NVARCHAR(16) NOT NULL,
    IPAddress NVARCHAR(45) NOT NULL,
    UserAgent NVARCHAR(500) NULL,
    LookupDate DATETIME NOT NULL DEFAULT GETDATE(),
    Success BIT NOT NULL DEFAULT 1,
    
    CONSTRAINT FK_InvoiceLookupLog_Invoice 
        FOREIGN KEY (InvoiceID) REFERENCES Invoice(InvoiceID)
);

-- Index cho rate limiting
CREATE INDEX IX_InvoiceLookupLog_IPAddress_Date 
ON InvoiceLookupLog(IPAddress, LookupDate);
```

---

## 💻 **BACKEND IMPLEMENTATION**

### **Controller: InvoiceController.cs**

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Net;

namespace EIMS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoiceController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;
        private readonly ILogger<InvoiceController> _logger;

        public InvoiceController(
            IInvoiceService invoiceService,
            ILogger<InvoiceController> logger)
        {
            _invoiceService = invoiceService;
            _logger = logger;
        }

        /// <summary>
        /// Public API để tra cứu hóa đơn bằng lookup code (không cần authentication)
        /// </summary>
        /// <param name="lookupCode">Mã tra cứu bí mật (8-16 ký tự)</param>
        /// <returns>Thông tin hóa đơn cơ bản</returns>
        [HttpGet("public/lookup/{lookupCode}")]
        [EnableRateLimiting("PublicLookup")] // Rate limiting policy
        [AllowAnonymous] // Không cần authentication
        public async Task<IActionResult> PublicLookupInvoice(string lookupCode)
        {
            try
            {
                // ==================== 1. VALIDATE INPUT ====================
                if (string.IsNullOrWhiteSpace(lookupCode))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Mã tra cứu không được để trống",
                        errorCode = "INVALID_LOOKUP_CODE"
                    });
                }

                // Validate format (alphanumeric, 8-16 chars)
                if (!System.Text.RegularExpressions.Regex.IsMatch(lookupCode, @"^[A-Z0-9]{8,16}$"))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Mã tra cứu không hợp lệ. Vui lòng kiểm tra lại",
                        errorCode = "INVALID_LOOKUP_CODE"
                    });
                }

                // ==================== 2. GET CLIENT INFO ====================
                var ipAddress = GetClientIPAddress();
                var userAgent = Request.Headers["User-Agent"].ToString();

                // ==================== 3. LOOKUP INVOICE ====================
                var invoice = await _invoiceService.GetInvoiceByLookupCodeAsync(lookupCode);

                if (invoice == null)
                {
                    // Log failed attempt
                    await _invoiceService.LogLookupAttemptAsync(
                        lookupCode: lookupCode,
                        ipAddress: ipAddress,
                        userAgent: userAgent,
                        success: false
                    );

                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy hóa đơn với mã tra cứu này",
                        errorCode = "INVOICE_NOT_FOUND"
                    });
                }

                // ==================== 4. CHECK INVOICE STATUS ====================
                // Chỉ cho phép tra cứu hóa đơn đã phát hành (status = 2)
                if (invoice.InvoiceStatusID != 2)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Hóa đơn chưa được phát hành hoặc không khả dụng",
                        errorCode = "INVOICE_NOT_AVAILABLE"
                    });
                }

                // ==================== 5. LOG SUCCESSFUL LOOKUP ====================
                await _invoiceService.LogLookupAttemptAsync(
                    invoiceId: invoice.InvoiceID,
                    lookupCode: lookupCode,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    success: true
                );

                // ==================== 6. BUILD RESPONSE ====================
                var response = new
                {
                    success = true,
                    message = "Tra cứu thành công",
                    data = new
                    {
                        invoiceNumber = invoice.InvoiceNumber.ToString("D7"), // Format: 0000123
                        serialNumber = invoice.Template?.Serial ?? "N/A",
                        templateCode = invoice.Template?.TemplateName ?? "N/A",
                        issueDate = invoice.SignDate?.ToString("dd/MM/yyyy") ?? "N/A",
                        customerName = invoice.Customer?.Name ?? "Khách lẻ",
                        taxCode = invoice.Customer?.TaxCode ?? "",
                        totalAmount = invoice.TotalAmount,
                        taxAmount = invoice.VatAmount,
                        status = GetInvoiceStatusLabel(invoice.InvoiceStatusID),
                        taxAuthorityCode = invoice.TaxAuthorityCode,
                        pdfUrl = GenerateSignedPdfUrl(invoice.InvoiceID, invoice.FilePath)
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in public invoice lookup for code: {LookupCode}", lookupCode);
                
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi hệ thống. Vui lòng thử lại sau",
                    errorCode = "INTERNAL_SERVER_ERROR"
                });
            }
        }

        /// <summary>
        /// Get client IP address (xử lý proxy/load balancer)
        /// </summary>
        private string GetClientIPAddress()
        {
            var xForwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            
            if (!string.IsNullOrEmpty(xForwardedFor))
            {
                // X-Forwarded-For có thể chứa nhiều IP, lấy IP đầu tiên
                return xForwardedFor.Split(',')[0].Trim();
            }

            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }

        /// <summary>
        /// Get invoice status label for display
        /// </summary>
        private string GetInvoiceStatusLabel(int statusId)
        {
            return statusId switch
            {
                1 => "Nháp",
                2 => "Đã phát hành",
                3 => "Đã hủy",
                4 => "Đã điều chỉnh",
                5 => "Đã thay thế",
                6 => "Chờ duyệt",
                7 => "Chờ ký",
                8 => "Từ chối",
                9 => "Chờ cấp số",
                10 => "Đã ký",
                _ => "Không xác định"
            };
        }

        /// <summary>
        /// Generate signed URL for PDF download (expires in 1 hour)
        /// </summary>
        private string? GenerateSignedPdfUrl(int invoiceId, string? filePath)
        {
            if (string.IsNullOrEmpty(filePath))
                return null;

            // TODO: Implement signed URL logic
            // Có thể dùng Azure Blob Storage SAS token hoặc tự implement
            // URL nên có expiration time (1 giờ)
            
            var baseUrl = $"https://storage.yourdomain.com/invoices/{invoiceId}.pdf";
            var expirationTime = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds();
            
            // Simplified - cần implement signature logic thực tế
            return $"{baseUrl}?expires={expirationTime}";
        }
    }
}
```

---

### **Service: IInvoiceService.cs (Interface)**

```csharp
public interface IInvoiceService
{
    /// <summary>
    /// Tìm hóa đơn theo lookup code
    /// </summary>
    Task<Invoice?> GetInvoiceByLookupCodeAsync(string lookupCode);

    /// <summary>
    /// Log tra cứu hóa đơn (audit trail)
    /// </summary>
    Task LogLookupAttemptAsync(
        int? invoiceId = null,
        string lookupCode = "",
        string ipAddress = "",
        string userAgent = "",
        bool success = true
    );

    /// <summary>
    /// Generate unique lookup code khi tạo/phát hành hóa đơn
    /// </summary>
    Task<string> GenerateLookupCodeAsync();

    /// <summary>
    /// Kiểm tra rate limit cho IP address
    /// </summary>
    Task<bool> IsRateLimitExceededAsync(string ipAddress);
}
```

---

### **Service: InvoiceService.cs (Implementation)**

```csharp
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

public class InvoiceService : IInvoiceService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<InvoiceService> _logger;
    private const int RATE_LIMIT_MINUTES = 1;
    private const int MAX_REQUESTS_PER_MINUTE = 10;

    public InvoiceService(
        ApplicationDbContext context,
        ILogger<InvoiceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Tìm hóa đơn theo lookup code
    /// </summary>
    public async Task<Invoice?> GetInvoiceByLookupCodeAsync(string lookupCode)
    {
        return await _context.Invoices
            .Include(i => i.Template)
            .Include(i => i.Customer)
            .Include(i => i.InvoiceItems)
            .FirstOrDefaultAsync(i => 
                i.LookupCode == lookupCode.ToUpper() &&
                i.InvoiceStatusID == 2 // Chỉ lấy hóa đơn đã phát hành
            );
    }

    /// <summary>
    /// Log tra cứu hóa đơn
    /// </summary>
    public async Task LogLookupAttemptAsync(
        int? invoiceId = null,
        string lookupCode = "",
        string ipAddress = "",
        string userAgent = "",
        bool success = true)
    {
        try
        {
            var log = new InvoiceLookupLog
            {
                InvoiceID = invoiceId,
                LookupCode = lookupCode,
                IPAddress = ipAddress,
                UserAgent = userAgent,
                LookupDate = DateTime.UtcNow,
                Success = success
            };

            _context.InvoiceLookupLogs.Add(log);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log lookup attempt");
            // Không throw exception - logging failure không nên block lookup
        }
    }

    /// <summary>
    /// Generate unique lookup code (8 ký tự uppercase alphanumeric)
    /// </summary>
    public async Task<string> GenerateLookupCodeAsync()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Loại bỏ ký tự dễ nhầm (0, O, I, 1)
        const int length = 10;

        var random = new Random();
        string lookupCode;

        // Retry nếu trùng (unlikely nhưng cần xử lý)
        do
        {
            lookupCode = "LC" + new string(Enumerable
                .Range(0, length - 2)
                .Select(_ => chars[random.Next(chars.Length)])
                .ToArray());
        }
        while (await _context.Invoices.AnyAsync(i => i.LookupCode == lookupCode));

        return lookupCode;
    }

    /// <summary>
    /// Kiểm tra rate limit
    /// </summary>
    public async Task<bool> IsRateLimitExceededAsync(string ipAddress)
    {
        var cutoffTime = DateTime.UtcNow.AddMinutes(-RATE_LIMIT_MINUTES);

        var requestCount = await _context.InvoiceLookupLogs
            .Where(log => 
                log.IPAddress == ipAddress && 
                log.LookupDate >= cutoffTime)
            .CountAsync();

        return requestCount >= MAX_REQUESTS_PER_MINUTE;
    }
}
```

---

## ⚙️ **RATE LIMITING CONFIGURATION**

### **Program.cs / Startup.cs:**

```csharp
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

// Add rate limiting services
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("PublicLookup", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10; // 10 requests
        limiterOptions.Window = TimeSpan.FromMinutes(1); // per minute
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 0; // No queue
    });

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            success = false,
            message = "Bạn đã vượt quá giới hạn tra cứu. Vui lòng thử lại sau 1 phút",
            errorCode = "RATE_LIMIT_EXCEEDED",
            retryAfter = 60
        }, cancellationToken);
    };
});

// Use rate limiting middleware
app.UseRateLimiter();
```

---

## 🔄 **WORKFLOW: Tạo Lookup Code khi Phát Hành Hóa Đơn**

### **Trong hàm IssueInvoice() hoặc SignInvoice():**

```csharp
public async Task<IActionResult> IssueInvoice(int invoiceId)
{
    var invoice = await _context.Invoices.FindAsync(invoiceId);
    
    if (invoice == null)
        return NotFound();

    // ... validation logic ...

    // ==================== GENERATE LOOKUP CODE ====================
    if (string.IsNullOrEmpty(invoice.LookupCode))
    {
        invoice.LookupCode = await _invoiceService.GenerateLookupCodeAsync();
    }

    // ==================== UPDATE STATUS ====================
    invoice.InvoiceStatusID = 2; // Đã phát hành
    invoice.SignDate = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    // ==================== SEND EMAIL TO CUSTOMER ====================
    // Include lookup code in email:
    // "Mã tra cứu hóa đơn của bạn: {invoice.LookupCode}"
    // "Tra cứu tại: https://yourdomain.com/tra-cuu"

    return Ok();
}
```

---

## 📧 **EMAIL TEMPLATE (Gửi cho khách hàng)**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Thông báo hóa đơn điện tử</title>
</head>
<body>
    <h2>Kính gửi Quý khách hàng,</h2>
    
    <p>Công ty chúng tôi xin gửi đến Quý khách thông tin hóa đơn điện tử:</p>
    
    <table>
        <tr>
            <td><strong>Số hóa đơn:</strong></td>
            <td>{{InvoiceNumber}}</td>
        </tr>
        <tr>
            <td><strong>Ký hiệu:</strong></td>
            <td>{{SerialNumber}}</td>
        </tr>
        <tr>
            <td><strong>Ngày phát hành:</strong></td>
            <td>{{IssueDate}}</td>
        </tr>
        <tr>
            <td><strong>Tổng tiền:</strong></td>
            <td>{{TotalAmount}} VNĐ</td>
        </tr>
    </table>
    
    <hr>
    
    <p><strong>MÃ TRA CỨU HÓA ĐƠN:</strong></p>
    <h1 style="color: #06b6d4; font-size: 32px; letter-spacing: 4px;">
        {{LookupCode}}
    </h1>
    
    <p>Quý khách có thể tra cứu và tải hóa đơn tại:</p>
    <a href="https://yourdomain.com/tra-cuu" 
       style="background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
        🔍 Tra cứu hóa đơn
    </a>
    
    <p style="margin-top: 20px;">
        <small>Lưu ý: Vui lòng giữ mã tra cứu này để tra cứu hóa đơn sau này.</small>
    </p>
    
    <hr>
    
    <p>Trân trọng,<br>
    <strong>CÔNG TY CỔ PHẦN GIẢI PHÁP TỔNG THỂ KỶ NGUYÊN SỐ</strong></p>
</body>
</html>
```

---

## 🧪 **TESTING**

### **1. Unit Tests:**

```csharp
[Test]
public async Task PublicLookupInvoice_ValidCode_ReturnsInvoice()
{
    // Arrange
    var lookupCode = "LC8A7B9C4D";
    
    // Act
    var result = await _controller.PublicLookupInvoice(lookupCode);
    
    // Assert
    Assert.IsInstanceOf<OkObjectResult>(result);
    var okResult = result as OkObjectResult;
    Assert.IsNotNull(okResult.Value);
}

[Test]
public async Task PublicLookupInvoice_InvalidCode_ReturnsNotFound()
{
    // Arrange
    var lookupCode = "INVALID123";
    
    // Act
    var result = await _controller.PublicLookupInvoice(lookupCode);
    
    // Assert
    Assert.IsInstanceOf<NotFoundObjectResult>(result);
}

[Test]
public async Task PublicLookupInvoice_RateLimitExceeded_Returns429()
{
    // Arrange
    var lookupCode = "LC8A7B9C4D";
    
    // Act - Make 11 requests
    for (int i = 0; i < 11; i++)
    {
        await _controller.PublicLookupInvoice(lookupCode);
    }
    
    var result = await _controller.PublicLookupInvoice(lookupCode);
    
    // Assert
    Assert.AreEqual(429, (result as StatusCodeResult)?.StatusCode);
}
```

### **2. Manual Testing với Postman:**

```http
### Test 1: Tra cứu thành công
GET http://localhost:5000/api/Invoice/public/lookup/LC8A7B9C4D
Accept: application/json

### Test 2: Mã không tồn tại
GET http://localhost:5000/api/Invoice/public/lookup/INVALID123
Accept: application/json

### Test 3: Rate limiting (chạy 11 lần)
GET http://localhost:5000/api/Invoice/public/lookup/LC8A7B9C4D
Accept: application/json
```

---

## 📊 **MONITORING & LOGGING**

### **Metrics cần track:**

1. **Request Count:**
   - Tổng số tra cứu/ngày
   - Tra cứu thành công vs thất bại
   - Tỷ lệ tra cứu theo giờ (peak hours)

2. **Performance:**
   - Response time trung bình
   - P95, P99 latency
   - Database query time

3. **Security:**
   - Số lượng tra cứu bị rate limit
   - Top IP addresses tra cứu nhiều nhất
   - Failed lookup attempts (suspicious activity)

### **Logging Example:**

```csharp
_logger.LogInformation(
    "Public invoice lookup: Code={LookupCode}, IP={IPAddress}, Success={Success}",
    lookupCode,
    ipAddress,
    success
);
```

---

## 🔐 **SECURITY BEST PRACTICES**

1. ✅ **Input Validation:**
   - Regex validate lookup code format
   - Prevent SQL injection
   - Sanitize all inputs

2. ✅ **Rate Limiting:**
   - Per IP: 10 requests/minute
   - Per lookup code: 100 requests/day (prevent brute force)

3. ✅ **Logging & Monitoring:**
   - Log tất cả tra cứu
   - Alert khi có suspicious activity
   - Monitor failed attempts

4. ✅ **Data Protection:**
   - Không trả về sensitive data
   - PDF URL có expiration (1 hour)
   - HTTPS only

5. ✅ **CAPTCHA (Frontend):**
   - Validate CAPTCHA trước khi gọi API
   - Prevent automated scraping

---

## 📝 **DEPLOYMENT CHECKLIST**

- [ ] Database migration (thêm LookupCode column)
- [ ] Tạo InvoiceLookupLog table
- [ ] Deploy API endpoint
- [ ] Configure rate limiting
- [ ] Setup monitoring & alerts
- [ ] Test với production data
- [ ] Update email templates
- [ ] Generate lookup codes cho invoices cũ (migration)
- [ ] Document API trong Swagger/OpenAPI
- [ ] Security audit

---

## 🚀 **NEXT STEPS (Future Enhancements)**

1. **QR Code:**
   - Generate QR code chứa lookup code
   - Scan QR để tra cứu nhanh

2. **Multi-language:**
   - Hỗ trợ tiếng Anh, tiếng Việt
   - i18n cho response messages

3. **SMS Notification:**
   - Gửi SMS với lookup code
   - SMS verification

4. **Advanced Analytics:**
   - Dashboard cho admin
   - Customer engagement metrics

---

**Created:** January 9, 2026  
**Version:** 1.0  
**Status:** 📋 Ready for Implementation  
**Estimated Time:** 2-3 days development + 1 day testing
