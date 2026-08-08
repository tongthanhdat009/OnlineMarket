using System.Net;
using System.Net.Mail;

namespace dotnet_backend.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var emailUser = _configuration["Email:User"];
            var emailPass = _configuration["Email:Pass"];

            if (string.IsNullOrEmpty(emailUser) || string.IsNullOrEmpty(emailPass))
            {
                Console.WriteLine("Email configuration missing.");
                return;
            }

            var fromAddress = new MailAddress(emailUser, "Store Management");
            var toAddress = new MailAddress(toEmail);

            var smtp = new SmtpClient
            {
                Host = "smtp.gmail.com",
                Port = 587,
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(fromAddress.Address, emailPass)
            };

            using (var message = new MailMessage(fromAddress, toAddress)
            {
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            })
            {
                await smtp.SendMailAsync(message);
            }
        }
    }
}
