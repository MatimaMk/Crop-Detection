using System.Threading.Tasks;
using CropDesease.Models.TokenAuth;
using CropDesease.Web.Controllers;
using Shouldly;
using Xunit;

namespace CropDesease.Web.Tests.Controllers
{
    public class HomeController_Tests: CropDeseaseWebTestBase
    {
        [Fact]
        public async Task Index_Test()
        {
            await AuthenticateAsync(null, new AuthenticateModel
            {
                UserNameOrEmailAddress = "admin",
                Password = "123qwe"
            });

            //Act
            var response = await GetResponseAsStringAsync(
                GetUrl<HomeController>(nameof(HomeController.Index))
            );

            //Assert
            response.ShouldNotBeNullOrEmpty();
        }
    }
}