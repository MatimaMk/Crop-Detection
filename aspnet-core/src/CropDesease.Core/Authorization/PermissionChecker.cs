using Abp.Authorization;
using CropDesease.Authorization.Roles;
using CropDesease.Authorization.Users;

namespace CropDesease.Authorization
{
    public class PermissionChecker : PermissionChecker<Role, User>
    {
        public PermissionChecker(UserManager userManager)
            : base(userManager)
        {
        }
    }
}
