using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using enoch_api.Data;
using enoch_api.Models;
using System.Security.Claims;

namespace enoch_api.Hubs;

[Authorize]
public class EnochHub : Hub
{
    private readonly EnochDbContext _context;
    public EnochHub(EnochDbContext context)
    {
        _context = context;
    }

    public async Task SendMessage(string content)
    {
        var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out Guid userId)) return;

        var message = new Message
        {
            UserId = userId,
            Role = "user",
            Content = content
        };
        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        // Send user's message back to caller
        await Clients.Caller.SendAsync("ReceiveMessage", message);


    }

    public async Task BroadcastSos(double lat, double lng)
    {
        var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out Guid userId)) return;

        var alert = new SosAlert
        {
            UserId = userId,
            Latitude = lat,
            Longitude = lng
        };
        _context.SosAlerts.Add(alert);
        await _context.SaveChangesAsync();

        // Alert all connected clients (e.g. dashboards)
        await Clients.All.SendAsync("SosAlertReceived", alert);
    }
}
