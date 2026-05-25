# Nails Studio Platform

Plataforma de reservas online para salón de uñas/estética.

## Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Nginx
- **Backend**: NestJS + Prisma 5 + PostgreSQL
- **Auth**: JWT (solo admin)

---

## 🐳 Docker (recomendado)

### Requisitos
- Docker + Docker Compose

### Levantar todo
```bash
cd nails-platform
docker compose up --build -d
```

| Servicio | URL |
|----------|-----|
| Frontend (React) | http://localhost |
| Backend API | http://localhost:3000/api |
| PostgreSQL | localhost:5432 |

### Cargar datos de ejemplo (solo la primera vez)
```bash
docker compose --profile seed up seed
```
Esto crea el admin y algunos servicios/empleadas de ejemplo.

**Login admin:** `admin@nails.com` / `admin123`

### Variable de entorno en producción
Crear un archivo `.env` en la raíz del proyecto:
```env
JWT_SECRET=tu_secreto_super_seguro_aqui
```

### Comandos útiles
```bash
# Ver logs
docker compose logs -f

# Detener
docker compose down

# Detener y borrar la base de datos
docker compose down -v

# Reconstruir imágenes
docker compose up --build -d
```

---

## 💻 Desarrollo local (sin Docker)

### Requisitos
- Node.js 18+
- PostgreSQL corriendo localmente

### 1. Base de datos
```sql
CREATE DATABASE nails_platform;
```

### 2. Backend
```bash
cd backend
# Ajustar DATABASE_URL en .env si es necesario
npx prisma db push
npx prisma db seed
npm run start:dev
```
Corre en http://localhost:3000/api

### 3. Frontend
```bash
cd frontend
npm run dev
```
Corre en http://localhost:5173

---

## Rutas

| URL | Descripción |
|-----|-------------|
| `/` | Reserva pública de turnos |
| `/admin/login` | Login admin |
| `/admin/appointments` | Ver todos los turnos |
| `/admin/availability` | Configurar disponibilidad por día/empleada |
| `/admin/employees` | Gestionar empleadas |
| `/admin/services` | Gestionar servicios |

## API Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /api/auth/login | No | Login admin |
| GET | /api/employees | No | Listar empleadas |
| POST | /api/employees | Admin | Crear empleada |
| PUT | /api/employees/:id | Admin | Editar empleada |
| DELETE | /api/employees/:id | Admin | Eliminar empleada |
| GET | /api/services | No | Listar servicios |
| POST | /api/services | Admin | Crear servicio |
| GET | /api/availability?year=&month= | No | Disponibilidad del mes |
| GET | /api/availability/slots?date=&employeeId=&duration= | No | Horarios libres |
| POST | /api/availability | Admin | Configurar disponibilidad |
| DELETE | /api/availability/:id | Admin | Eliminar disponibilidad |
| GET | /api/appointments | Admin | Ver turnos |
| POST | /api/appointments | No | Reservar turno |
| PATCH | /api/appointments/:id/cancel | Admin | Cancelar turno |
