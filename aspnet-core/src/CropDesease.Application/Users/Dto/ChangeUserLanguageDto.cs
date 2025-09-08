using System.ComponentModel.DataAnnotations;

namespace CropDesease.Users.Dto
{
    public class ChangeUserLanguageDto
    {
        [Required]
        public string LanguageName { get; set; }
    }
}