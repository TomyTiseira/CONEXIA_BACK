# Service Hirings Module

Este módulo implementa la funcionalidad de contratación de servicios para la plataforma CONEXIA.

## Características principales

- **Contratación de servicios**: Los usuarios pueden solicitar la contratación de servicios
- **Sistema de cotizaciones**: Los dueños de servicios pueden generar cotizaciones
- **Estados de contratación**: Manejo completo del ciclo de vida de una contratación
- **Validaciones de seguridad**: Control de roles y permisos
- **Negociación**: Posibilidad de negociar cotizaciones

## Estados de contratación

- **Pending**: Solicitud pendiente de cotización
- **Quoted**: Cotización enviada por el dueño del servicio
- **Accepted**: Cotización aceptada por el cliente
- **Rejected**: Cotización rechazada por el cliente
- **Cancelled**: Solicitud cancelada
- **Negotiating**: En proceso de negociación
- **In Progress**: Servicio en progreso
- **Completed**: Servicio completado

## Instalación

1. Asegúrate de que el microservicio de servicios esté corriendo
2. Ejecuta las migraciones de base de datos
3. Ejecuta el seed de estados:

```bash
cd services
npm run seed:service-hiring-statuses
```

## Endpoints principales

### API Gateway

- `POST /service-hirings` - Crear solicitud de contratación
- `GET /service-hirings/my-requests` - Ver mis solicitudes
- `GET /service-hirings/my-services` - Ver solicitudes de mis servicios
- `POST /service-hirings/:id/quotation` - Crear cotización
- `PUT /service-hirings/:id/quotation` - Editar cotización
- `POST /service-hirings/:id/accept` - Aceptar cotización
- `POST /service-hirings/:id/reject` - Rechazar cotización
- `POST /service-hirings/:id/cancel` - Cancelar solicitud
- `POST /service-hirings/:id/negotiate` - Iniciar negociación

## Validaciones de negocio

- Solo usuarios con rol USER pueden contratar servicios
- Administradores y moderadores no pueden contratar servicios
- Un usuario no puede contratar su propio servicio
- Solo se puede cotizar si el usuario solicitante sigue activo
- Las cotizaciones solo se pueden editar si no han sido aceptadas
- Se valida que el dueño del servicio tenga cuenta cargada (pendiente de CNX-29)

## Arquitectura

El módulo sigue el patrón de arquitectura limpia utilizado en el resto del proyecto:

- **Entities**: Definición de entidades de base de datos
- **DTOs**: Objetos de transferencia de datos
- **Repositories**: Acceso a datos
- **Services**: Lógica de negocio
- **Use Cases**: Casos de uso específicos
- **Controllers**: Controladores de API
- **States**: Patrón State para manejo de estados

## Base de datos

### Tabla service_hirings

- id (Primary Key)
- userId (ID del usuario que contrata)
- serviceId (ID del servicio)
- statusId (ID del estado)
- description (Descripción de lo que necesita)
- quotedPrice (Precio cotizado)
- estimatedHours (Horas estimadas)
- quotationNotes (Notas de la cotización)
- quotedAt (Fecha de cotización)
- respondedAt (Fecha de respuesta)
- createdAt (Fecha de creación)
- updatedAt (Fecha de actualización)

### Tabla service_hiring_statuses

- id (Primary Key)
- name (Nombre del estado)
- code (Código único del estado)
- description (Descripción del estado)
- isActive (Si está activo)
- createdAt (Fecha de creación)
- updatedAt (Fecha de actualización)
