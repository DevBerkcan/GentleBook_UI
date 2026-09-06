# GentleBook – Buchungssystem

Multi-Tenant Online-Buchungssystem für Salons, Barbershops, Beauty Studios und mehr.

## Stack
- **Frontend**: Next.js 14, TypeScript, TailwindCSS, NextUI
- **Backend**: .NET 8, ASP.NET Core, Entity Framework Core, SQL Server
- **Hosting**: Vercel (Frontend) + MonsterASP (API)

## URLs
- Frontend: https://gentle-book-ui.vercel.app
- API: https://gentlebook.runasp.net
- Admin: https://gentle-book-ui.vercel.app/admin/login
- SuperAdmin: https://gentle-book-ui.vercel.app/superadmin/login

## SuperAdmin Zugangsdaten (Erst-Setup)
Email: admin@gentlebook.app

## Entwicklung

Frontend (dieses Verzeichnis):
```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL ggf. auf http://localhost:5067/api prüfen
npm install
npm run dev
```

Backend (`../Gentle.Book.API`) braucht eine lokale SQL-Server-Instanz — per Docker Compose:
```bash
cd ../Gentle.Book.API
docker compose up -d          # SQL Server auf localhost:1433 (siehe appsettings.Development.json)
dotnet ef database update     # Schema aus den vorhandenen Migrationen anlegen
dotnet run                    # läuft auf http://localhost:5067
```
Kein Seed-Skript vorhanden — Tenant/Abo/Mitarbeiter/Services zum Testen einmalig manuell über die
laufende App anlegen (Registrierung → SuperAdmin-Bootstrap `/api/auth/superadmin/bootstrap` →
Plan zuweisen).

## Development, Staging und Production

Der Branch- und Deployment-Ablauf sowie alle benötigten Environment Variables
sind in [DEPLOYMENT_ENVIRONMENTS.md](./DEPLOYMENT_ENVIRONMENTS.md) beschrieben.
