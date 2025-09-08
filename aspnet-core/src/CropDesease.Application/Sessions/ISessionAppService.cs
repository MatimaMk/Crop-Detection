using System.Threading.Tasks;
using Abp.Application.Services;
using CropDesease.Sessions.Dto;

namespace CropDesease.Sessions
{
    public interface ISessionAppService : IApplicationService
    {
        Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations();
    }
}
