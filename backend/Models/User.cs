namespace enoch_api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Location> Locations { get; set; } = new List<Location>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
    public ICollection<SosAlert> SosAlerts { get; set; } = new List<SosAlert>();
    public ICollection<Device> Devices { get; set; } = new List<Device>();
}
