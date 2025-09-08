using Abp.Application.Services;
using CropDesease.MultiTenancy.Dto;

namespace CropDesease.MultiTenancy
{
    public interface ITenantAppService : IAsyncCrudAppService<TenantDto, int, PagedTenantResultRequestDto, CreateTenantDto, TenantDto>
    {
    }
}

