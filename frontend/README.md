# MediAssist: Plataforma Integral de Gestión Hospitalaria con Asistencia Inteligente

MediAssist es una plataforma web completa para la administración hospitalaria que integra un asistente virtual inteligente para mejorar la gestión de pacientes, citas, recursos y análisis estadísticos.

---

## Descripción General

MediAssist busca transformar la gestión hospitalaria tradicional en un sistema eficiente, inteligente y centrado en datos. Se desarrolla utilizando tecnologías modernas como React para el frontend, Node.js para el backend, MySQL como base de datos, y componentes de Inteligencia Artificial para análisis y asistencia virtual, todo orquestado con Docker para escalabilidad y despliegue sencillo.

---

## Componentes Principales

1.  **Portal de Administración (React):**
    *   Dashboard interactivo con estadísticas clave.
    *   Gestión centralizada de pacientes, médicos y personal.
    *   Calendario dinámico para citas y disponibilidad de recursos (habitaciones, quirófanos).
    *   Visualización de reportes estadísticos mediante gráficos interactivos.

2.  **Backend (Node.js):**
    *   API RESTful segura para la comunicación frontend-backend.
    *   Autenticación y autorización basada en roles usando JWT.
    *   Integración eficiente con la base de datos MySQL mediante un ORM (Sequelize).
    *   Lógica de negocio y procesamiento de datos para estadísticas.

3.  **Base de Datos (MySQL):**
    *   Esquema de base de datos relacional y normalizado.
    *   Almacenamiento seguro de información de pacientes, historial médico, personal, citas, inventario, habitaciones y datos financieros.

4.  **Asistente Virtual con IA:**
    *   Chatbot integrado para consultas rápidas sobre disponibilidad, horarios, etc.
    *   Capacidad de Procesamiento de Lenguaje Natural (NLP) para interacciones fluidas.
    *   (Futuro) Potencial para recomendaciones y análisis predictivos básicos.

5.  **Reportes Estadísticos:**
    *   Análisis de ocupación hospitalaria.
    *   Tendencias de citas y consultas.
    *   Informes básicos de facturación e inventario.
    *   Generación de gráficos dinámicos para fácil interpretación.

6.  **Implementación con Docker:**
    *   Contenedores para frontend, backend y base de datos.
    *   Orquestación con Docker Compose para fácil configuración y despliegue.
    *   Entornos consistentes para desarrollo y producción.

---

## Funcionalidades Destacadas

*   **Autenticación Segura:** Sistema de login multinivel (administradores, médicos, etc.).
*   **Dashboard Personalizado:** Vistas adaptadas según el rol del usuario.
*   **Gestión Integral:** Módulos CRUD para pacientes, citas, personal, inventario, habitaciones.
*   **Asistente Virtual:** Acceso rápido a información común.
*   **Reportes Dinámicos:** Gráficos interactivos para la toma de decisiones.
*   **Interfaz Adaptativa:** Diseño responsive para uso en escritorio y móviles.

---

## Objetivo del Proyecto

Desarrollar una plataforma integral que **optimice los procesos administrativos y clínicos** de un hospital mediante:

*   ✅ **Centralización** de la información.
*   ✅ **Automatización** de tareas con un asistente virtual.
*   ✅ **Análisis de datos** para la toma de decisiones informada.
*   ✅ **Mejora de la experiencia de usuario** para el personal.
*   ✅ **Implementación de una arquitectura moderna y escalable** (React, Node.js, MySQL, Docker, IA).

---

## Tecnologías Utilizadas

*   **Frontend:** React, React Router
*   **Backend:** Node.js
*   **Base de Datos:** MySQL.
*   **Asistente Virtual:** Librerías de NLP (ej. Natural).
*   **Containerización:** Docker, Docker Compose.

---

## Equipo de Desarrollo

| Líder del Proyecto         | Desarrollo Frontend           | Desarrollo Backend            | Diseño UX/UI               |
|----------------------------|-------------------------------|-------------------------------|----------------------------|
| ![Flor](Fotos/Captura.PNG) | ![Leo](Fotos/leo.PNG)         | ![Mathias](Fotos/mathias.PNG) | ![Jherson](Fotos/rivera.PNG) |
| **Flor Cordova**         | **Leonardo Quispe**           | **Mathias Tenemas**              | **Jherson Rivera**          |
| *Ing. Sistemas*            | *Especialista en React*       | *Especialista en Node.js*     | *Diseñador de Interfaces*   |

##  Instalación 

Sigue estos pasos para configurar y ejecutar el frontend del proyecto MediAssist en tu máquina local.

### Prerrequisitos

- Node.js (v14 o superior recomendado)
- npm (viene con Node.js) o yarn
- Git (opcional)

### 1. Crear la aplicación React
Ejecuta el siguiente comando para crear la estructura inicial del proyecto:

```powershell
npx create-react-app "nombre de el proyecto"
```
### 2. Iniciar la aplicación
Para iniciar el servidor de desarrollo:

```powershell
npm start
```
### 3. Instalar dependencias principales
Ejecuta el siguiente comando para crear la estructura inicial del proyecto:

```powershell
# Dependencias básicas
npm install

# Enrutamiento
npm install react-router-dom

# Gestión de estado (Redux)
npm install redux react-redux redux-thunk

# Cliente HTTP para API
npm install axios

# Librería de gráficos
npm install recharts
```
### 4. Dependencias opcionales
Para iniciar el servidor de desarrollo:

```powershell
npm start
# Manejo de fechas
npm install date-fns

# Manejo de JWT
npm install jwt-decode

# Generación de PDF
npm install jspdf jspdf-autotable

```
### 25. Configuración adicional
Para iniciar el servidor de desarrollo:

```powershell
npm start
```
