using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using dotnet_backend.Services.Interface;

namespace dotnet_backend.Services;

public sealed class S3Service : IS3Service
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _defaultBucket;
    private readonly string _publicBucket;
    private readonly string _privateBucket;
    private readonly string _root;
    private readonly string _publicUrl;
    private readonly string _privateUrl;
    private readonly string _endpoint;
    private readonly string _region;

    public S3Service(IAmazonS3 s3Client, IConfiguration configuration)
    {
        _s3Client = s3Client;
        _defaultBucket = Setting(configuration, "AWS:BucketName", "AWS_BUCKET") ?? throw new ArgumentNullException("AWS_BUCKET");
        _publicBucket = Setting(configuration, "AWS:PublicBucket", "AWS_PUBLIC_BUCKET") ?? _defaultBucket;
        _privateBucket = Setting(configuration, "AWS:PrivateBucket", "AWS_PRIVATE_BUCKET") ?? _defaultBucket;
        _root = NormalizePrefix(Setting(configuration, "AWS:Root", "AWS_ROOT"));
        _endpoint = (Setting(configuration, "AWS:Endpoint", "AWS_ENDPOINT") ?? string.Empty).TrimEnd('/');
        _publicUrl = (Setting(configuration, "AWS:PublicUrl", "AWS_PUBLIC_URL") ?? Setting(configuration, "AWS:Url", "AWS_URL") ?? string.Empty).TrimEnd('/');
        _privateUrl = (Setting(configuration, "AWS:PrivateUrl", "AWS_PRIVATE_URL") ?? string.Empty).TrimEnd('/');
        _region = Setting(configuration, "AWS:Region", "AWS_DEFAULT_REGION") ?? "us-east-1";
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        var name = NormalizePrefix(fileName);
        if (name.StartsWith("public/", StringComparison.OrdinalIgnoreCase)) name = name["public/".Length..];
        if (_root.Length > 0 && name.StartsWith($"{_root}/public/", StringComparison.OrdinalIgnoreCase)) name = name[(_root.Length + "/public/".Length)..];
        var key = CombineKey("public", name);
        await new TransferUtility(_s3Client).UploadAsync(new TransferUtilityUploadRequest
        {
            InputStream = fileStream,
            Key = key,
            BucketName = _publicBucket,
            ContentType = contentType
        });
        return key;
    }

    public string GetFileUrl(string s3Key)
    {
        if (string.IsNullOrWhiteSpace(s3Key)) return string.Empty;
        var key = ExtractKeyFromUrl(s3Key);
        var bucket = IsPrivateKey(key) ? _privateBucket : _publicBucket;
        var baseUrl = IsPrivateKey(key) ? _privateUrl : _publicUrl;
        return BuildObjectUrl(baseUrl, bucket, key);
    }

    public Task<string> GetImageUrlAsync(string s3Key, int expirationMinutes = 60)
    {
        return IsPrivateKey(ExtractKeyFromUrl(s3Key))
            ? GetPresignedUrlAsync(s3Key, expirationMinutes)
            : Task.FromResult(GetFileUrl(s3Key));
    }

    public Task<string> GetPresignedUrlAsync(string s3Key, int expirationMinutes = 60)
    {
        if (string.IsNullOrWhiteSpace(s3Key)) return Task.FromResult(string.Empty);
        var key = ExtractKeyFromUrl(s3Key);
        var url = _s3Client.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = IsPrivateKey(key) ? _privateBucket : _publicBucket,
            Key = key,
            Expires = DateTime.UtcNow.AddMinutes(Math.Clamp(expirationMinutes, 1, 1440))
        });
        return Task.FromResult(url);
    }

    public async Task<bool> DeleteFileAsync(string s3Key)
    {
        if (string.IsNullOrWhiteSpace(s3Key)) return false;
        var key = ExtractKeyFromUrl(s3Key);
        try
        {
            await _s3Client.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = IsPrivateKey(key) ? _privateBucket : _publicBucket,
                Key = key
            });
            return true;
        }
        catch (AmazonS3Exception)
        {
            return false;
        }
    }

    public async Task<bool> FileExistsAsync(string s3Key)
    {
        if (string.IsNullOrWhiteSpace(s3Key)) return false;
        var key = ExtractKeyFromUrl(s3Key);
        try
        {
            await _s3Client.GetObjectMetadataAsync(new GetObjectMetadataRequest
            {
                BucketName = IsPrivateKey(key) ? _privateBucket : _publicBucket,
                Key = key
            });
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
        catch (AmazonS3Exception)
        {
            return false;
        }
    }

    private string CombineKey(params string[] segments)
    {
        var parts = new List<string>();
        foreach (var segment in segments)
        {
            var value = NormalizePrefix(segment);
            if (value.Length > 0 && (parts.Count == 0 || !string.Equals(parts[^1], value, StringComparison.OrdinalIgnoreCase)))
                parts.Add(value);
        }

        var key = string.Join('/', parts);
        return _root.Length == 0 || key.StartsWith($"{_root}/", StringComparison.OrdinalIgnoreCase) || key.Equals(_root, StringComparison.OrdinalIgnoreCase)
            ? key
            : $"{_root}/{key}";
    }

    private bool IsPrivateKey(string key) =>
        key.Equals("private", StringComparison.OrdinalIgnoreCase) ||
        key.StartsWith("private/", StringComparison.OrdinalIgnoreCase) ||
        (_root.Length > 0 && key.StartsWith($"{_root}/private/", StringComparison.OrdinalIgnoreCase));

    private string BuildObjectUrl(string baseUrl, string bucket, string key)
    {
        if (!string.IsNullOrWhiteSpace(baseUrl))
            return $"{baseUrl}/{Uri.EscapeDataString(key).Replace("%2F", "/", StringComparison.OrdinalIgnoreCase)}";
        if (!string.IsNullOrWhiteSpace(_endpoint))
            return $"{_endpoint}/{bucket}/{Uri.EscapeDataString(key).Replace("%2F", "/", StringComparison.OrdinalIgnoreCase)}";
        return $"https://{bucket}.s3.{_region}.amazonaws.com/{Uri.EscapeDataString(key).Replace("%2F", "/", StringComparison.OrdinalIgnoreCase)}";
    }

    private string ExtractKeyFromUrl(string urlOrKey)
    {
        if (!Uri.TryCreate(urlOrKey, UriKind.Absolute, out var uri)) return NormalizePrefix(urlOrKey);
        var path = uri.AbsolutePath.Trim('/');
        var bucket = uri.Host.Split('.')[0];
        if (path.StartsWith($"{bucket}/", StringComparison.OrdinalIgnoreCase)) path = path[(bucket.Length + 1)..];
        return Uri.UnescapeDataString(path);
    }

    private static string? Setting(IConfiguration configuration, string key, string environmentKey) =>
        configuration[key] ?? configuration[environmentKey];

    private static string NormalizePrefix(string? value) =>
        (value ?? string.Empty).Trim().Trim('/');
}
