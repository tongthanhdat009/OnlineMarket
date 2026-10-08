using dotnet_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace dotnet_backend.Database;

public partial class ApplicationDbContext
{
    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public void ConfigureAuditLog(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("audit_logs");
            entity.HasKey(x => x.EventId).HasName("PRIMARY");
            entity.HasIndex(x => x.CreatedAt);
            entity.HasIndex(x => x.Action);
            entity.HasIndex(x => x.ActorId);

            entity.Property(x => x.EventId).HasColumnName("event_id").ValueGeneratedOnAdd();
            entity.Property(x => x.CreatedAt).HasColumnType("datetime(6)").HasColumnName("created_at");
            entity.Property(x => x.ActorId).HasColumnName("actor_id");
            entity.Property(x => x.ActorName).HasMaxLength(120).HasColumnName("actor_name");
            entity.Property(x => x.ActorType).HasMaxLength(20).HasColumnName("actor_type");
            entity.Property(x => x.Action).HasMaxLength(60).HasColumnName("action");
            entity.Property(x => x.SubjectType).HasMaxLength(40).HasColumnName("subject_type");
            entity.Property(x => x.Subject).HasMaxLength(60).HasColumnName("subject");
            entity.Property(x => x.Note).HasMaxLength(500).HasColumnName("note");
            entity.Property(x => x.Method).HasMaxLength(10).HasColumnName("method");
            entity.Property(x => x.Path).HasMaxLength(300).HasColumnName("path");
            entity.Property(x => x.StatusCode).HasColumnName("status_code");
        });
    }
}
