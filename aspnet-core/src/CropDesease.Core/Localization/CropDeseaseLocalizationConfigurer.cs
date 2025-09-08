using Abp.Configuration.Startup;
using Abp.Localization.Dictionaries;
using Abp.Localization.Dictionaries.Xml;
using Abp.Reflection.Extensions;

namespace CropDesease.Localization
{
    public static class CropDeseaseLocalizationConfigurer
    {
        public static void Configure(ILocalizationConfiguration localizationConfiguration)
        {
            localizationConfiguration.Sources.Add(
                new DictionaryBasedLocalizationSource(CropDeseaseConsts.LocalizationSourceName,
                    new XmlEmbeddedFileLocalizationDictionaryProvider(
                        typeof(CropDeseaseLocalizationConfigurer).GetAssembly(),
                        "CropDesease.Localization.SourceFiles"
                    )
                )
            );
        }
    }
}
