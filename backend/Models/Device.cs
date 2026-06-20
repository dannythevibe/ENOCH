namespace enoch_api.Models;

public class Device
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string MacAddress { get; set; } = string.Empty;
    public DateTime LastSeen { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Connected"; // Connected, Lost

    public User? User { get; set; }
}
