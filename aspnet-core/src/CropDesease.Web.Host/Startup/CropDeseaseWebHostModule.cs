using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Abp.Modules;
using Abp.Reflection.Extensions;
using CropDesease.Configuration;

namespace CropDesease.Web.Host.Startup
{
    [DependsOn(
       typeof(CropDeseaseWebCoreModule))]
    public class CropDeseaseWebHostModule: AbpModule
    {
        private readonly IWebHostEnvironment _env;
        private readonly IConfigurationRoot _appConfiguration;

        public CropDeseaseWebHostModule(IWebHostEnvironment env)
        {
            _env = env;
            _appConfiguration = env.GetAppConfiguration();
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(CropDeseaseWebHostModule).GetAssembly());
        }
    }
}
