using Auth_jwt.Data;
using Auth_jwt.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Auth_jwt.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserSettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Kullanıcı ayarlarını almak için
        [HttpGet]
        [Route("GetSettings")]
        public async Task<IActionResult> GetSettings()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User is not authenticated.");
            }

            var userSettings = await _context.UserSettings
                .FirstOrDefaultAsync(us => us.UserId == userId);

            if (userSettings == null)
            {
                return NotFound("User settings not found.");
            }

            return Ok(userSettings);
        }

        // Kullanıcı ayarlarını güncellemek için
        [HttpPut]
        [Route("UpdateSettings")]
        public async Task<IActionResult> UpdateSettings([FromBody] UserSettings userSettings)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User is not authenticated.");
            }

            var existingSettings = await _context.UserSettings
                .FirstOrDefaultAsync(us => us.UserId == userId);

            if (existingSettings == null)
            {
                return NotFound("User settings not found.");
            }

            existingSettings.NotificationsEnabled = userSettings.NotificationsEnabled;

            await _context.SaveChangesAsync();

            return Ok(existingSettings);
        }

        // User ID'yi almak için helper method
        private string GetCurrentUserId()
        {
            // Kullanıcı kimliğini Claim'den alıyoruz
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Eğer userId yoksa Unauthorized dönebiliriz
            if (string.IsNullOrEmpty(userId))
            {
                return null;
            }

            return userId;
        }
    }
}
