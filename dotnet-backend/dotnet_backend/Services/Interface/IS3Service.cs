namespace dotnet_backend.Services.Interface;

public interface IS3Service
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
    string GetFileUrl(string s3Key);
    Task<string> GetImageUrlAsync(string s3Key, int expirationMinutes = 60);
    bool IsManagedProductImageKey(string s3Key);
    Task<bool> DeleteFileAsync(string s3Key);
}
