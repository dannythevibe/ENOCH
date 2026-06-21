using enoch_api.Data;
using enoch_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace enoch_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly EnochDbContext _context;

    public MessagesController(EnochDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetMessages()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized("User claim not found or invalid.");

        var messages = await _context.Messages
            .Where(m => m.UserId == userId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new {
                m.Id,
                m.Role,
                m.Content,
                m.CreatedAt
            })
            .ToListAsync();

        return Ok(messages);
    }

    [HttpPost]
    public async Task<IActionResult> AddMessage([FromBody] CreateMessageDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized("User claim not found or invalid.");

        var message = new Message
        {
            UserId = userId,
            Role = dto.Role,
            Content = dto.Content,
            CreatedAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        return Ok(new { message.Id, message.Role, message.Content, message.CreatedAt });
    }
}

public class CreateMessageDto
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
