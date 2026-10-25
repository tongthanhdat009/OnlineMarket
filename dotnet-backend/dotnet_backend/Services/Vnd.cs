namespace dotnet_backend.Services;

/// <summary>
/// VND khong co phan thap phan. Ep decimal sang int bang lam tron ( AwayFromZero )
/// de tong dong hang khop voi so da thu - cat phan thap phan lech 1 VND moi don.
/// </summary>
public static class Vnd
{
    public static int Round(decimal value) => (int)Math.Round(value, MidpointRounding.AwayFromZero);
}
