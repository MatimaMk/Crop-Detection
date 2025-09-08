using Abp.AutoMapper;
using Abp.Modules;
using Abp.Reflection.Extensions;
using CropDesease.Authorization;

namespace CropDesease
{
    [DependsOn(
        typeof(CropDeseaseCoreModule), 
        typeof(AbpAutoMapperModule))]
    public class CropDeseaseApplicationModule : AbpModule
    {
        public override void PreInitialize()
        {
            Configuration.Authorization.Providers.Add<CropDeseaseAuthorizationProvider>();
        }

        public override void Initialize()
        {
            var thisAssembly = typeof(CropDeseaseApplicationModule).GetAssembly();

            IocManager.RegisterAssemblyByConvention(thisAssembly);

            Configuration.Modules.AbpAutoMapper().Configurators.Add(
                // Scan the assembly for classes which inherit from AutoMapper.Profile
                cfg => cfg.AddMaps(thisAssembly)
            );
        }
    }
}
