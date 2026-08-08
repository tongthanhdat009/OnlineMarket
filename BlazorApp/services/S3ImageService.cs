using BlazorApp.Services.Interface;

namespace BlazorApp.Services
{
    public class S3ImageService : IS3ImageService
    {
        private readonly string _bucketName;
        private readonly string _region;
        // Using a data URI to avoid 404 errors
        private readonly string _placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";

        public S3ImageService(IConfiguration configuration)
        {
            _bucketName = configuration["AWS:BucketName"] ?? "dotnet-app-images";
            _region = configuration["AWS:Region"] ?? "ap-southeast-2";
        }

        public Task<string> GetImageUrlAsync(string? imageUrlOrKey)
        {
            if (string.IsNullOrWhiteSpace(imageUrlOrKey) ||
                !Uri.TryCreate(imageUrlOrKey, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                return Task.FromResult(_placeholderImage);
            }

            return Task.FromResult(imageUrlOrKey);
        }

        public bool IsS3Url(string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return false;
            }

            return url.Contains($"{_bucketName}.s3.{_region}.amazonaws.com", StringComparison.OrdinalIgnoreCase) ||
                   url.Contains($"s3.{_region}.amazonaws.com/{_bucketName}", StringComparison.OrdinalIgnoreCase);
        }

        public string GetPlaceholderImage()
        {
            return _placeholderImage;
        }
    }
}
