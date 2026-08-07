using dotnet_backend.Services.Interface;

namespace dotnet_backend.Services;

public sealed class UnavailableS3Service : IS3Service
{
    private static InvalidOperationException NotConfigured() =>
        new("AWS S3 is not configured.");

    public Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType) =>
        Task.FromException<string>(NotConfigured());

    public string GetFileUrl(string s3Key) => throw NotConfigured();

    public Task<string> GetPresignedUrlAsync(string s3Key, int expirationMinutes = 60) =>
        Task.FromException<string>(NotConfigured());

    public Task<bool> DeleteFileAsync(string s3Key) =>
        Task.FromException<bool>(NotConfigured());

    public Task<bool> FileExistsAsync(string s3Key) =>
        Task.FromException<bool>(NotConfigured());
}
