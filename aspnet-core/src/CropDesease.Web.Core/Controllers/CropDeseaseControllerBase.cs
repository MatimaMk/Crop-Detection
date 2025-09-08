using Abp.AspNetCore.Mvc.Controllers;
using Abp.IdentityFramework;
using Microsoft.AspNetCore.Identity;

namespace CropDesease.Controllers
{
    public abstract class CropDeseaseControllerBase: AbpController
    {
        protected CropDeseaseControllerBase()
        {
            LocalizationSourceName = CropDeseaseConsts.LocalizationSourceName;
        }

        protected void CheckErrors(IdentityResult identityResult)
        {
            identityResult.CheckErrors(LocalizationManager);
        }
    }
}
