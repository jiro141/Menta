# 🍃 Menta To-Do App

Menta es una aplicación web de gestión de tareas minimalista, diseñada para reducir la fricción visual y promover un flujo de trabajo enfocado y libre de estrés. 

El proyecto funciona con una arquitectura desacoplada: una **API REST** en el backend y una **Single Page Application (SPA)** en el frontend.

---

## 🛠️ Stack Tecnológico

**Frontend:**
* **React:** Construcción de la interfaz de usuario.
* **Tailwind CSS:** Estilos rápidos, utilitarios y diseño responsivo.

**Backend & Base de Datos:**
* **Django:** Framework para la lógica de servidor (Django REST Framework).
* **SQLite:** Base de datos ligera para desarrollo.

---

## ✨ Características Principales
* Interfaz minimalista y orgánica.
* Operaciones **CRUD** (Crear, Leer, Actualizar, Eliminar) instantáneas.
* Diseño **100% responsivo** (Mobile-first).

---

## 🚀 Instalación y Uso Local

Para correr este proyecto, asegúrate de tener instalados **Node.js** y **Python**.

### 1. Configuración del Backend (Django)
Navega a la carpeta del backend y ejecuta los siguientes comandos:

```bash
python -m venv venv
source venv/bin/activate  # En Windows usa: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

```

### 2. Configuración del Frontend (React)

En una nueva terminal, navega a la carpeta del frontend y ejecuta:

```bash
npm install
npm run dev

```

> [!TIP]
> Por defecto, el frontend correrá en `http://localhost:5173` y el backend en `http://localhost:8000`. Asegúrate de tener ambos servicios activos para que la app funcione correctamente.

```

