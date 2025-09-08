using System.Threading.Tasks;
using CropDesease.Configuration.Dto;

namespace CropDesease.Configuration
{
    public interface IConfigurationAppService
    {
        Task ChangeUiTheme(ChangeUiThemeInput input);
    }
}
