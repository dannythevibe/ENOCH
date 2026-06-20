# Use the official .NET 10.0 SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy the csproj file and restore any dependencies (via nuget)
COPY ["enoch-api.csproj", "./"]
RUN dotnet restore "enoch-api.csproj"

# Copy the project files and build our release
COPY . ./
RUN dotnet publish "enoch-api.csproj" -c Release -o out

# Generate runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/out .

# Render exposes the port in the PORT environment variable.
# .NET looks for ASPNETCORE_URLS or uses port 80/8080 by default. We'll set it here.
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "enoch-api.dll"]
