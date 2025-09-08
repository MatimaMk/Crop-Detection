FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src
COPY ["src/CropDesease.Web.Host/CropDesease.Web.Host.csproj", "src/CropDesease.Web.Host/"]
COPY ["src/CropDesease.Web.Core/CropDesease.Web.Core.csproj", "src/CropDesease.Web.Core/"]
COPY ["src/CropDesease.Application/CropDesease.Application.csproj", "src/CropDesease.Application/"]
COPY ["src/CropDesease.Core/CropDesease.Core.csproj", "src/CropDesease.Core/"]
COPY ["src/CropDesease.EntityFrameworkCore/CropDesease.EntityFrameworkCore.csproj", "src/CropDesease.EntityFrameworkCore/"]
WORKDIR "/src/src/CropDesease.Web.Host"
RUN dotnet restore 

WORKDIR /src
COPY ["src/CropDesease.Web.Host", "src/CropDesease.Web.Host"]
COPY ["src/CropDesease.Web.Core", "src/CropDesease.Web.Core"]
COPY ["src/CropDesease.Application", "src/CropDesease.Application"]
COPY ["src/CropDesease.Core", "src/CropDesease.Core"]
COPY ["src/CropDesease.EntityFrameworkCore", "src/CropDesease.EntityFrameworkCore"]
WORKDIR "/src/src/CropDesease.Web.Host"
RUN dotnet publish -c Release -o /publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
EXPOSE 80
WORKDIR /app
COPY --from=build /publish .
ENTRYPOINT ["dotnet", "CropDesease.Web.Host.dll"]
