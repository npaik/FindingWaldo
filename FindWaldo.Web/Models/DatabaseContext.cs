using Microsoft.EntityFrameworkCore;

namespace FindWaldo.Web.Models;

public class DatabaseContext : DbContext
{
    public DatabaseContext(DbContextOptions<DatabaseContext> options)
        : base(options) { }

    public DbSet<Message> Messages { get; set; }
    public DbSet<User> Users { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Message>()
            .Property(e => e.CreatedAt)
            .HasDefaultValueSql("now()");

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<User>()
        .Property(u => u.Score)
        .HasDefaultValue(0);

        modelBuilder.Entity<User>()
        .Property(u => u.X)
        .HasDefaultValue(0);

        modelBuilder.Entity<User>()
        .Property(u => u.Y)
        .HasDefaultValue(0);
    }
    }
