using Microsoft.EntityFrameworkCore;
using Abp.Zero.EntityFrameworkCore;
using CropDesease.Authorization.Roles;
using CropDesease.Authorization.Users;
using CropDesease.MultiTenancy;

namespace CropDesease.EntityFrameworkCore
{
    public class CropDeseaseDbContext : AbpZeroDbContext<Tenant, Role, User, CropDeseaseDbContext>
    {
        /* Define a DbSet for each entity of the application */
        
        public CropDeseaseDbContext(DbContextOptions<CropDeseaseDbContext> options)
            : base(options)
        {
        }
    }
}
