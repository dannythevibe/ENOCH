using enoch_api.Models;
using Microsoft.EntityFrameworkCore;

namespace enoch_api.Data;

public class EnochDbContext : DbContext
{
    public EnochDbContext(DbContextOptions<EnochDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Location> Locations { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<SosAlert> SosAlerts { get; set; }
    public DbSet<Device> Devices { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
}
