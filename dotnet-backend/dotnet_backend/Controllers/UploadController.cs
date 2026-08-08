using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using dotnet_backend.Services.Interface;

namespace dotnet_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IS3Service _s3Service;
    private readonly ILogger<UploadController> _logger;

    public UploadController(IS3Service s3Service, ILogger<UploadController> logger)
    {
        _s3Service = s3Service;
        _logger = logger;
    }

    /// <summary>
    /// Lấy presigned URL cho S3 key (cho private bucket)
    /// </summary>
    [HttpGet("presigned-url")]
    public async Task<IActionResult> GetPresignedUrl([FromQuery] string s3Key, [FromQuery] int expirationMinutes = 60)
    {
        try
        {
            if (string.IsNullOrEmpty(s3Key))
            {
                return BadRequest(new { message = "S3 key không được để trống" });
            }

            var url = await _s3Service.GetImageUrlAsync(s3Key, expirationMinutes);
            
            if (string.IsNullOrEmpty(url))
            {
                return NotFound(new { message = "Không thể generate URL" });
            }

            return Ok(new { url, expiresIn = expirationMinutes });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting presigned URL");
            return StatusCode(500, new { message = $"Lỗi: {ex.Message}" });
        }
    }

    /// <summary>
    /// Upload ảnh sản phẩm lên S3
    /// </summary>
    [HttpPost("product-image")]
    public async Task<IActionResult> UploadProductImage(IFormFile file)
    {
        try
        {
            // Validate file
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "File không được để trống" });
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { message = "Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)" });
            }

            // Validate file size (max 5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "File không được vượt quá 5MB" });
            }

            // Upload to S3
            using var stream = file.OpenReadStream();
            var imageUrl = await _s3Service.UploadFileAsync(stream, file.FileName, file.ContentType);

            return Ok(new
            {
                imageUrl,
                fileName = file.FileName,
                size = file.Length,
                message = "Upload ảnh thành công"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image to S3");
            return StatusCode(500, new { message = $"Lỗi khi upload ảnh: {ex.Message}" });
        }
    }

    /// <summary>
    /// Xóa ảnh từ S3
    /// </summary>
    [HttpDelete("product-image")]
    public async Task<IActionResult> DeleteProductImage([FromQuery] string imageUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(imageUrl))
            {
                return BadRequest(new { message = "Image URL không được để trống" });
            }

            var result = await _s3Service.DeleteFileAsync(imageUrl);
            
            if (result)
            {
                return Ok(new { message = "Xóa ảnh thành công" });
            }
            else
            {
                return NotFound(new { message = "Không tìm thấy ảnh để xóa" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image from S3");
            return StatusCode(500, new { message = $"Lỗi khi xóa ảnh: {ex.Message}" });
        }
    }

    /// <summary>
    /// Kiểm tra ảnh có tồn tại trên S3 không
    /// </summary>
    [HttpGet("product-image/exists")]
    public async Task<IActionResult> CheckImageExists([FromQuery] string imageUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(imageUrl))
            {
                return BadRequest(new { message = "Image URL không được để trống" });
            }

            var exists = await _s3Service.FileExistsAsync(imageUrl);
            
            return Ok(new { exists, imageUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking image existence in S3");
            return StatusCode(500, new { message = $"Lỗi khi kiểm tra ảnh: {ex.Message}" });
        }
    }
}
