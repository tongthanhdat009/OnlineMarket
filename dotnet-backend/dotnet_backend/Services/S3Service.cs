using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using dotnet_backend.Services.Interface;

namespace dotnet_backend.Services;

public sealed class S3Service : IS3Service
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucket;
    private readonly string _publicPrefix;
    private readonly string _privatePrefix;
    private readonly string _root;
    private readonly string _publicUrl;
    private readonly string _privateUrl;
    private readonly string _endpoint;
    private readonly string _region;

    public S3Service(IAmazonS3 s3Client, IConfiguration configuration)
    {
        _s3Client = s3Client;
        _bucket = Setting(configuration, "AWS:BucketName", "AWS_BUCKET") ?? throw new ArgumentNullException("AWS_BUCKET");
        _publicPrefix = NormalizePrefix(Setting(configuration, "AWS:PublicBucket", "AWS_PUBLIC_BUCKET") ?? "public");
        _privatePrefix = NormalizePrefix(Setting(configuration, "AWS:PrivateBucket", "AWS_PRIVATE_BUCKET") ?? "private");
        _root = NormalizePrefix(Setting(configuration, "AWS:Root", "AWS_ROOT"));
        _endpoint = (Setting(configuration, "AWS:Endpoint", "AWS_ENDPOINT") ?? string.Empty).TrimEnd('/');
        _publicUrl = (Setting(configuration, "AWS:PublicUrl", "AWS_PUBLIC_URL") ?? Setting(configuration, "AWS:Url", "AWS_URL") ?? string.Empty).TrimEnd('/');
        _privateUrl = (Setting(configuration, "AWS:PrivateUrl", "AWS_PRIVATE_URL") ?? string.Empty).TrimEnd('/');
        _region = Setting(configuration, "AWS:Region", "AWS_DEFAULT_REGION") ?? "us-east-1";
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        var name = ExtractKeyFromUrl(fileName);
        name = RemovePrefix(name, _root);
        name = RemovePrefix(name, _publicPrefix);
        var key = CombineKey(_publicPrefix, name);
        await new TransferUtility(_s3Client).UploadAsync(new TransferUtilityUploadRequest
        {
            InputStream = fileStream,
            Key = key,
            BucketName = _bucket,
            ContentType = contentType,
            CannedACL = S3CannedACL.PublicRead
        });
        return key;
    }

    public string GetFileUrl(string s3Key)
    {
        if (string.IsNullOrWhiteSpace(s3Key)) return string.Empty;
        var key = NormalizeKey(ExtractKeyFromUrl(s3Key));
        if (!IsManagedProductImageKey(key)) return string.Empty;

        var baseUrl = IsPrivateKey(key) ? _privateUrl : _publicUrl;
        return BuildObjectUrl(baseUrl, key);
    }

    public Task<string> GetImageUrlAsync(string s3Key, int expirationMinutes = 60)
    {
        var key = NormalizeKey(ExtractKeyFromUrl(s3Key));
        if (!IsManagedProductImageKey(key)) return Task.FromResult(string.Empty);

        return IsPrivateKey(key)
            ? GetPresignedUrlAsync(key, expirationMinutes)
            : Task.FromResult(GetFileUrl(key));
    }

    private Task<string> GetPresignedUrlAsync(string s3Key, int expirationMinutes = 60)
    {
        if (string.IsNullOrWhiteSpace(s3Key)) return Task.FromResult(string.Empty);
        var key = NormalizeKey(ExtractKeyFromUrl(s3Key));
        var url = _s3Client.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = _bucket,
            Key = key,
            Expires = DateTime.UtcNow.AddMinutes(Math.Clamp(expirationMinutes, 1, 1440))
        });
        return Task.FromResult(url);
    }

    public async Task<bool> DeleteFileAsync(string s3Key)
    {
        if (string.IsNullOrWhiteSpace(s3Key)) return false;
        var key = NormalizeKey(ExtractKeyFromUrl(s3Key));
        if (!IsManagedProductImageKey(key)) return false;

        try
        {
            await _s3Client.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _bucket,
                Key = key
            });
            return true;
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

    private string NormalizeKey(string key)
    {
        if (_root.Length > 0 && key.StartsWith($"{_root}/", StringComparison.OrdinalIgnoreCase)) return key;
        if (key.Equals(_publicPrefix, StringComparison.OrdinalIgnoreCase) || key.StartsWith($"{_publicPrefix}/", StringComparison.OrdinalIgnoreCase))
            return CombineKey(key);
        if (key.Equals(_privatePrefix, StringComparison.OrdinalIgnoreCase) || key.StartsWith($"{_privatePrefix}/", StringComparison.OrdinalIgnoreCase))
            return CombineKey(key);
        if (IsLegacyProductImageFileName(key)) return CombineKey(_publicPrefix, key);
        return key;
    }

    public bool IsManagedProductImageKey(string s3Key)
    {
        var key = NormalizeKey(ExtractKeyFromUrl(s3Key));
        var imageKey = RemovePrefix(key, _root);
        return imageKey.Equals(_publicPrefix, StringComparison.OrdinalIgnoreCase) ||
            imageKey.StartsWith($"{_publicPrefix}/", StringComparison.OrdinalIgnoreCase) ||
            imageKey.Equals(_privatePrefix, StringComparison.OrdinalIgnoreCase) ||
            imageKey.StartsWith($"{_privatePrefix}/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsLegacyProductImageFileName(string key)
    {
        if (key.Length == 0 || key.Contains('/')) return false;

        return key.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
            key.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase) ||
            key.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
            key.EndsWith(".webp", StringComparison.OrdinalIgnoreCase) ||
            key.EndsWith(".gif", StringComparison.OrdinalIgnoreCase) ||
            key.EndsWith(".avif", StringComparison.OrdinalIgnoreCase);
    }

    private bool IsPrivateKey(string key) =>
        key.Equals(_privatePrefix, StringComparison.OrdinalIgnoreCase) ||
        key.StartsWith($"{_privatePrefix}/", StringComparison.OrdinalIgnoreCase) ||
        (_root.Length > 0 && key.StartsWith($"{_root}/{_privatePrefix}/", StringComparison.OrdinalIgnoreCase));

    private string BuildObjectUrl(string baseUrl, string key)
    {
        var pathKey = key;
        if (!string.IsNullOrWhiteSpace(baseUrl))
        {
            if (_root.Length > 0 && Uri.TryCreate(baseUrl, UriKind.Absolute, out var uri))
            {
                var basePath = NormalizePrefix(uri.AbsolutePath);
                if (basePath.StartsWith($"{_bucket}/", StringComparison.OrdinalIgnoreCase)) basePath = basePath[(_bucket.Length + 1)..];
                if (basePath.Equals(_root, StringComparison.OrdinalIgnoreCase) || basePath.EndsWith($"/{_root}", StringComparison.OrdinalIgnoreCase))
                    pathKey = RemovePrefix(pathKey, _root);
            }

            return $"{baseUrl}/{EscapeKey(pathKey)}";
        }

        if (!string.IsNullOrWhiteSpace(_endpoint)) return $"{_endpoint}/{_bucket}/{EscapeKey(key)}";
        return $"https://{_bucket}.s3.{_region}.amazonaws.com/{EscapeKey(key)}";
    }

    private string ExtractKeyFromUrl(string urlOrKey)
    {
        if (!Uri.TryCreate(urlOrKey, UriKind.Absolute, out var uri)) return NormalizePrefix(urlOrKey);
        var path = NormalizePrefix(uri.AbsolutePath);
        if (path.StartsWith($"{_bucket}/", StringComparison.OrdinalIgnoreCase)) path = path[(_bucket.Length + 1)..];
        return Uri.UnescapeDataString(path);
    }

    private static string RemovePrefix(string value, string prefix)
    {
        if (prefix.Length == 0) return value;
        if (value.Equals(prefix, StringComparison.OrdinalIgnoreCase)) return string.Empty;
        return value.StartsWith($"{prefix}/", StringComparison.OrdinalIgnoreCase) ? value[(prefix.Length + 1)..] : value;
    }

    private static string EscapeKey(string key) => Uri.EscapeDataString(key).Replace("%2F", "/", StringComparison.OrdinalIgnoreCase);

    private static string? Setting(IConfiguration configuration, string key, string environmentKey) =>
        configuration[key] ?? configuration[environmentKey];

    private static string NormalizePrefix(string? value) =>
        (value ?? string.Empty).Trim().Trim('/');
}
