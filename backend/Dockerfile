# Stage 1: Build .NET 10 API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["VietTTS.Api/VietTTS.Api.csproj", "VietTTS.Api/"]
RUN dotnet restore "VietTTS.Api/VietTTS.Api.csproj"

COPY . .
WORKDIR "/src/VietTTS.Api"
RUN dotnet publish "VietTTS.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "VietTTS.Api.dll"]
