using enoch_api.Data;
using enoch_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace enoch_api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LocationsController : ControllerBase
{
    private readonly EnochDbContext _context;

    public LocationsController(EnochDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> PostLocation([FromBody] LocationDto request)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

        var location = new Location
        {
            UserId = userId,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Timestamp = DateTime.UtcNow
        };

        _context.Locations.Add(location);
        await _context.SaveChangesAsync();
        return Ok(location);
    }

    [HttpGet]
    public async Task<IActionResult> GetUserLocations()
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

        var locations = await _context.Locations
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.Timestamp)
            .Take(50)
            .ToListAsync();
        return Ok(locations);
    }
}

public class LocationDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}
