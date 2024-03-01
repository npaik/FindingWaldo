using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Linq;
using FindWaldo.Web.Models;
using FindWaldo.Web.Hubs;
using System.Text;
using Newtonsoft.Json;
using Microsoft.AspNetCore.SignalR;

namespace FindWaldo.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly DatabaseContext _context;
        private readonly IHubContext<GameHub> _hubContext;

        public UsersController(DatabaseContext context, IHubContext<GameHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }
        
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetUser", new { id = user.Id }, user);
        }

        [HttpPut("{username}")]
        public async Task<IActionResult> UpdateUserScore(string username, User NewUser)
        {

            Console.WriteLine("username: " + username);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());

            if (user == null)
            {
                return NotFound($"User with username {username} not found.");
            }

            user.Score = NewUser.Score;
            user.X = NewUser.X;
            user.Y = NewUser.Y;

            try
            {
                await _context.SaveChangesAsync();
                await _hubContext.Clients.All.SendAsync("UserFoundWaldo", user);
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(409, "A concurrency update error occurred. Please try again.");
            }

            return NoContent();
        }




        [HttpGet("byUsername/{username}")]
        public async Task<ActionResult<User>> GetUserByUsername(string username)
        {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);

        if (user == null)
        {
        return NotFound();
        }

        return user;
}

    
    }
}





