using CropDesease.Debugging;

namespace CropDesease
{
    public class CropDeseaseConsts
    {
        public const string LocalizationSourceName = "CropDesease";

        public const string ConnectionStringName = "Default";

        public const bool MultiTenancyEnabled = true;


        /// <summary>
        /// Default pass phrase for SimpleStringCipher decrypt/encrypt operations
        /// </summary>
        public static readonly string DefaultPassPhrase =
            DebugHelper.IsDebug ? "gsKxGZ012HLL3MI5" : "032ff04198774f788770700fff40b9ab";
    }
}
