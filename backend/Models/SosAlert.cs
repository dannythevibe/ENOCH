namespace enoch_api.Models;

public class SosAlert
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Status { get; set; } = "Active"; // Active, Resolved
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
