using enoch_api.Data;
using enoch_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace enoch_api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DevicesController : ControllerBase
{
    private readonly EnochDbContext _context;

    public DevicesController(EnochDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetUserDevices()
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

        var devices = await _context.Devices.Where(d => d.UserId == userId).ToListAsync();
        return Ok(devices);
    }

    [HttpPost]
    public async Task<IActionResult> AddDevice([FromBody] DeviceDto request)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

        var device = new Device
        {
            UserId = userId,
            Name = request.Name,
            MacAddress = request.MacAddress,
            Status = "Connected"
        };

        _context.Devices.Add(device);
        await _context.SaveChangesAsync();
        return Ok(device);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] string status)
    {
        var device = await _context.Devices.FindAsync(id);
        if (device == null) return NotFound();

        device.Status = status;
        device.LastSeen = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(device);
    }
}

public class DeviceDto
{
    public string Name { get; set; } = string.Empty;
    public string MacAddress { get; set; } = string.Empty;
}
