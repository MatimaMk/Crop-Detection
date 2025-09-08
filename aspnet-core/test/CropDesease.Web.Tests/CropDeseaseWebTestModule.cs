using Abp.AspNetCore;
using Abp.AspNetCore.TestBase;
using Abp.Modules;
using Abp.Reflection.Extensions;
using CropDesease.EntityFrameworkCore;
using CropDesease.Web.Startup;
using Microsoft.AspNetCore.Mvc.ApplicationParts;

namespace CropDesease.Web.Tests
{
    [DependsOn(
        typeof(CropDeseaseWebMvcModule),
        typeof(AbpAspNetCoreTestBaseModule)
    )]
    public class CropDeseaseWebTestModule : AbpModule
    {
        public CropDeseaseWebTestModule(CropDeseaseEntityFrameworkModule abpProjectNameEntityFrameworkModule)
        {
            abpProjectNameEntityFrameworkModule.SkipDbContextRegistration = true;
        } 
        
        public override void PreInitialize()
        {
            Configuration.UnitOfWork.IsTransactional = false; //EF Core InMemory DB does not support transactions.
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(CropDeseaseWebTestModule).GetAssembly());
        }
        
        public override void PostInitialize()
        {
            IocManager.Resolve<ApplicationPartManager>()
                .AddApplicationPartsIfNotAddedBefore(typeof(CropDeseaseWebMvcModule).Assembly);
        }
    }
}