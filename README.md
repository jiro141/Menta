# 🍃 Menta To-Do App

Menta es una aplicación web de gestión de tareas minimalista, diseñada para reducir la fricción visual y promover un flujo de trabajo enfocado y libre de estrés. 

El proyecto funciona con una arquitectura separada: una API REST en el backend y una Single Page Application (SPA) en el frontend.

## 🛠️ Stack Tecnológico

**Frontend:**
* **React:** Construcción de la interfaz de usuario.
* **Tailwind CSS:** Estilos rápidos, utilitarios y diseño responsivo para mantener el esquema de colores limpio de Menta.

**Backend & Base de Datos:**
* **Django:** Framework principal para la lógica de servidor y API (Django REST Framework).
* **SQLite:** Base de datos ligera y rápida para el almacenamiento local de tareas durante el desarrollo.

## ✨ Características Principales
* Interfaz minimalista y orgánica.
* Operaciones CRUD (Crear, Leer, Actualizar, Eliminar) de tareas de forma instantánea.
* Diseño 100% responsivo (Mobile-first).

## 🚀 Instalación y Uso Local

Para correr este proyecto en tu máquina, necesitarás tener instalados Node.js y Python.

### 1. Configuración del Backend (Django)
Navega a la carpeta del backend y ejecuta:
```bash
python -m venv venv
source venv/bin/activate  # En Windows usa: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

### 2. Configuración del Frontend (React)
Abre una nueva terminal, navega a la carpeta del frontend y ejecuta:

```Bash
npm install
npm run dev
El frontend debería estar corriendo en http://localhost:5173 (o el puerto que te indique Vite/React) y consumiendo la API de Django en http://localhost:8000.