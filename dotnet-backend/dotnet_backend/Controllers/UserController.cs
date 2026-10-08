using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using dotnet_backend.Services.Interface;
using dotnet_backend.Dtos;

namespace dotnet_backend.Controllers
{
    [Authorize] // Bảo vệ toàn bộ controller
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        // GET: api/users - Ai đã login cũng xem được
        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] int? page, [FromQuery] int? pageSize, [FromQuery] string? search, [FromQuery] string? searchField)
        {
            if (page.HasValue && pageSize.HasValue)
            {
                var paged = await _userService.GetPagedAsync(page.Value, pageSize.Value, search, searchField);
                return Ok(paged);
            }
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpGet("total")]
        public async Task<IActionResult> GetTotalUsers()
        {
            var totalUsers = await _userService.GetTotalUsersAsync();
            return Ok(totalUsers);
        }

        // GET: api/users/5
        // GET: api/users/5 - Ai đã login cũng xem được
        [HttpGet("{id:int}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user is null) return NotFound();
            return Ok(user);
        }

        // POST: api/users - CHỈ Admin hoặc Manager mới tạo được user
        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser([FromBody] UserRequestDto req)
        {
            var userDto = new UserDto { Username = req.Username, Password = req.Password, FullName = req.FullName, Role = req.Role };
            // fixed validation
            UserDto createdUser;
            try
            {
                createdUser = await _userService.CreateUserAsync(userDto);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            return CreatedAtAction(nameof(GetUser), new { id = createdUser.UserId }, createdUser);

        }


        // PUT: api/users/5 - CHỈ Admin hoặc Manager mới update được
        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UserRequestDto req)
        {
            var userDto = new UserDto { UserId = req.UserId, Username = req.Username, Password = req.Password, FullName = req.FullName, Role = req.Role };
            if (id != userDto.UserId)
            {
                return BadRequest(new { message = "ID trên endpoint khác với body" });
            }

            UserDto? updatedUser;
            try
            {
                updatedUser = await _userService.UpdateUserAsync(id, userDto);
                if (updatedUser is null) return NotFound();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            return Ok(updatedUser);
        }

        // DELETE: api/users/5 - CHỈ Admin mới xóa được
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var deleted = await _userService.DeleteUserAsync(id);
            if (!deleted) return NotFound(new { message = "Không thể xóa tài khoản" });
            return Ok(new { message = "Xóa tài khoản thành công" });
        }
    }
}
