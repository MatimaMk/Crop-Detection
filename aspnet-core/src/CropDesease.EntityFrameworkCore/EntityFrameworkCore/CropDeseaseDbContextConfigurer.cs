using System.Data.Common;
using Microsoft.EntityFrameworkCore;

namespace CropDesease.EntityFrameworkCore
{
    public static class CropDeseaseDbContextConfigurer
    {
        public static void Configure(DbContextOptionsBuilder<CropDeseaseDbContext> builder, string connectionString)
        {
            builder.UseSqlServer(connectionString);
        }

        public static void Configure(DbContextOptionsBuilder<CropDeseaseDbContext> builder, DbConnection connection)
        {
            builder.UseSqlServer(connection);
        }
    }
}
