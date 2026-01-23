# 🔧 Corrección de isProfileComplete - Instrucciones para el Equipo

## ✅ Estado Actual

La corrección ya fue aplicada en tu base de datos. Los resultados son:

- **Admin (69 usuarios)**: ✅ Todos con `NULL` (correcto)
- **Moderador (20 usuarios)**: ✅ Todos con `NULL` (correcto)  
- **User (39 usuarios)**: ✅ 13 completos, 26 incompletos (correcto)

## 📋 Para Nuevos Miembros del Equipo

### Opción 1: Instalación desde cero (Recomendado)

Si es tu primera vez clonando el repositorio:

```bash
cd CONEXIA_BACK
docker-compose up -d
```

Las migraciones se ejecutarán automáticamente y todo funcionará correctamente. ✅

### Opción 2: Si ya tienes la base de datos con datos antiguos

Si ya tenías el proyecto corriendo ANTES de este cambio, ejecuta **UNA SOLA VEZ**:

**En Windows:**
```bash
.\fix-profile-complete.bat
```

**En Linux/Mac:**
```bash
chmod +x fix-profile-complete.sh
./fix-profile-complete.sh
```

**O manualmente:**
```bash
docker-compose up -d
Get-Content "users\postgres-init\14-fix-admin-moderator-profile-complete.sql" | docker exec -i conexia_back-users-db-1 psql -U postgres -d users_db
```

## 🔍 ¿Qué se corrigió?

El campo `isProfileComplete` en la tabla `users` ahora tiene los valores correctos:

- **`NULL`**: Para admins y moderadores (no necesitan perfil)
- **`true`**: Para usuarios con perfil completo (name, lastName, profession, documentTypeId, documentNumber)
- **`false`**: Para usuarios con perfil incompleto

## 🧪 Verificar que todo funciona

```bash
docker exec -it conexia_back-users-db-1 psql -U postgres -d users_db -c "SELECT r.name, COUNT(*) as total FROM users u JOIN roles r ON u.\"roleId\" = r.id GROUP BY r.name;"
```

Deberías ver algo como:
```
   role    | total
-----------+-------
 admin     |    69
 moderador |    20
 user      |    39
```

## ❓ FAQ

**P: ¿Tengo que ejecutar esto cada vez que hago `docker-compose up`?**  
R: No, solo una vez. Las migraciones ya están corregidas para nuevas instalaciones.

**P: ¿Qué pasa si ejecuto el script dos veces?**  
R: No hay problema, es idempotente. Solo actualiza lo que necesita actualizarse.

**P: ¿Por qué el front pide completar perfil a los admins?**  
R: Si no ejecutaste el script de corrección, los admins tienen `isProfileComplete = false` en lugar de `NULL`. Ejecuta el script y haz login de nuevo.

## 📝 Para Desarrollo

Al hacer login, el backend ahora devuelve:

```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "roleId": 1,
    "profileId": null,
    "isProfileComplete": null  // ← NULL para admin/moderador
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

El frontend debe revisar:
- Si `isProfileComplete === null` → No pedir completar perfil (es admin/moderador)
- Si `isProfileComplete === false` → Pedir completar perfil (usuario regular)
- Si `isProfileComplete === true` → Permitir acceso completo

## 🐛 Problemas?

Si algo no funciona:

1. Verifica que los contenedores estén corriendo:
   ```bash
   docker-compose ps
   ```

2. Revisa los logs:
   ```bash
   docker-compose logs users
   docker-compose logs users-db
   ```

3. Contacta al equipo en Slack 💬
