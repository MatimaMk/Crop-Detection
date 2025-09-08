using System.Threading.Tasks;
using Abp.Authorization;
using Abp.Runtime.Session;
using CropDesease.Configuration.Dto;

namespace CropDesease.Configuration
{
    [AbpAuthorize]
    public class ConfigurationAppService : CropDeseaseAppServiceBase, IConfigurationAppService
    {
        public async Task ChangeUiTheme(ChangeUiThemeInput input)
        {
            await SettingManager.ChangeSettingForUserAsync(AbpSession.ToUserIdentifier(), AppSettingNames.UiTheme, input.Theme);
        }
    }
}
