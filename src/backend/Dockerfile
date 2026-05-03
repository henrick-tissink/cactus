# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files first and restore
COPY src/Cactus.Domain/Cactus.Domain.csproj src/Cactus.Domain/
COPY src/Cactus.Application/Cactus.Application.csproj src/Cactus.Application/
COPY src/Cactus.Infrastructure/Cactus.Infrastructure.csproj src/Cactus.Infrastructure/
COPY src/Cactus.Api/Cactus.Api.csproj src/Cactus.Api/

WORKDIR /src/src/Cactus.Api
RUN dotnet restore

# Copy source files
WORKDIR /src
COPY src/Cactus.Domain/ src/Cactus.Domain/
COPY src/Cactus.Application/ src/Cactus.Application/
COPY src/Cactus.Infrastructure/ src/Cactus.Infrastructure/
COPY src/Cactus.Api/ src/Cactus.Api/

# Publish
WORKDIR /src/src/Cactus.Api
RUN dotnet publish -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install wget for health checks and create non-root user
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash appuser

COPY --from=build /app/publish .

# Set ownership
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Cactus.Api.dll"]
